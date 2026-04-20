# Documentación de Base de Datos - Foundify Backend

## Motor y entorno

- **Motor:** PostgreSQL 15 (Docker)
- **ORM:** Prisma
- **Schema SQL:** `public`
- **Contenedor:** `foundify-postgres`

---

## Credenciales de conexión (desarrollo)

Estas credenciales vienen de `docker-compose.yml` y `.env`.

- **Host:** `localhost`
- **Puerto:** `5432`
- **Base de datos:** `foundify`
- **Usuario:** `postgres`
- **Password:** `postgres`
- **URL completa:**

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/foundify?schema=public"
```

### Conexión rápida por CLI

```bash
psql -h localhost -p 5432 -U postgres -d foundify
```

---

## Decisión de modelado

Se usa **separación de responsabilidades**:

1. `users`: credenciales y datos mínimos de autenticación.
2. `user_profiles`: datos de perfil del usuario (personales/visuales).

### ¿Por qué separar `users` y `user_profiles`?

- Permite que el módulo de auth se mantenga limpio y enfocado en seguridad.
- Evita acoplar datos personales con credenciales.
- Facilita escalar a perfiles más complejos sin tocar autenticación.
- Permite evolucionar el perfil (campos opcionales, medios, etc.) con menor riesgo.

---

## Tablas

## 1) Tabla `users`

### Razón de ser
Contiene la identidad de autenticación y credenciales hash del usuario.

### Columnas

- **`id`** (`uuid`, PK)
  - Identificador único del usuario.
  - Se genera automáticamente.

- **`email`** (`text`, unique, not null)
  - Identificador de login del usuario.
  - Restricción única para evitar cuentas duplicadas.

- **`passwordHash`** (`text`, not null)
  - Hash seguro de la contraseña (bcrypt).
  - Nunca se almacena la contraseña en texto plano.

- **`createdAt`** (`timestamp`, default `now()`)
  - Fecha/hora de creación del registro.

- **`updatedAt`** (`timestamp`, auto-updated)
  - Fecha/hora de última actualización.

### Índices / restricciones relevantes

- PK: `id`
- UNIQUE: `email`

---

## 2) Tabla `user_profiles`

### Razón de ser
Guarda información de perfil del usuario separada de auth.

### Columnas

- **`id`** (`uuid`, PK)
  - Identificador único del perfil.

- **`userId`** (`uuid`, unique, FK -> `users.id`)
  - Relación 1:1 con `users`.
  - `unique` garantiza un solo perfil por usuario.

- **`firstName`** (`text`, not null)
  - Primer nombre del usuario.

- **`secondName`** (`text`, nullable)
  - Segundo nombre (opcional).

- **`firstLastName`** (`text`, not null)
  - Primer apellido.

- **`secondLastName`** (`text`, not null)
  - Segundo apellido.

- **`gender`** (`enum Gender`, not null)
  - Género del usuario.
  - Valores permitidos:
    - `MALE`
    - `FEMALE`
    - `OTHER`
    - `PREFER_NOT_TO_SAY`

- **`profilePhotoUrl`** (`text`, nullable)
  - URL de la foto de perfil.
  - Puede apuntar a S3, Cloudinary, Firebase Storage, etc.

- **`createdAt`** (`timestamp`, default `now()`)
  - Fecha/hora de creación del perfil.

- **`updatedAt`** (`timestamp`, auto-updated)
  - Fecha/hora de última actualización del perfil.

### Índices / restricciones relevantes

- PK: `id`
- UNIQUE: `userId`
- FK: `userId -> users.id` con `onDelete: Cascade`
  - Si se elimina el usuario, se elimina su perfil automáticamente.

---

## Enum `Gender`

Tipo enumerado en Prisma para estandarizar el dato y evitar strings libres.

Valores:
- `MALE`
- `FEMALE`
- `OTHER`
- `PREFER_NOT_TO_SAY`

---

## Sobre foto de perfil: ¿guardarla en BD o no?

### Recomendación para este proyecto

**No guardar binario de imagen directamente en PostgreSQL** para este caso.

Guardar en BD solo:
- `profilePhotoUrl` (URL pública o firmada), y opcionalmente
- metadatos (tamaño, tipo MIME) en el futuro.

### ¿Por qué?

- Mejor rendimiento de BD (menos tamaño y I/O).
- Menor costo y mejor escalabilidad.
- CDNs/servicios de objetos manejan imágenes mucho mejor.
- Backups/restores de DB más ligeros.

### Dónde guardar la imagen

Opciones comunes:
- AWS S3
- Cloudinary
- Firebase Storage
- Azure Blob Storage

---

## Flujo recomendado de registro (backend)

1. Crear usuario en `users` (email + passwordHash).
2. Crear perfil en `user_profiles` (nombres/apellidos/género/foto URL).
3. Emitir JWT de acceso.

---

## Notas de seguridad

- `passwordHash` debe generarse con bcrypt (salt rounds >= 10).
- Nunca loggear contraseña ni hash en consola.
- Validar URL de foto con DTOs y `class-validator`.
- Mantener `JWT_SECRET` fuera de repositorio (usar `.env`).

---

## Relación con Prisma (fuente de verdad)

Definición actual en:
- `prisma/schema.prisma`

Migraciones:
- `prisma/migrations/*`

Si cambias el modelo:
1. `npx prisma generate`
2. `npx prisma migrate dev --name <nombre_cambio>`

---

## Incidencias reales y cómo resolverlas

Durante la evolución del modelo (antes de dejar `user_profiles`), se presentó una inconsistencia de migraciones en desarrollo.

### Error observado

- **Drift detectado por Prisma** al correr:
  - `npx prisma migrate dev --name add_user_profile_register`
- Síntoma:
  - La BD local no reflejaba exactamente el historial esperado de migraciones.
  - `user_profiles` no aparecía en la BD.

### Causa raíz

- Existía una migración intermedia con estructura antigua (campos en `users`) que no coincidía con el modelo final separado (`users` + `user_profiles`).

### Solución aplicada (dev)

1. Corregir el SQL de la migración intermedia para que cree `user_profiles` (y no agregue columnas legacy en `users`).
2. Reaplicar migraciones desde cero en entorno local:

```bash
npx prisma migrate reset --force
```

3. Volver a cargar datos de prueba:

```bash
npm run prisma:seed
```

4. Verificar tablas:

```bash
docker exec -i foundify-postgres psql -U postgres -d foundify -c "\dt"
```

Resultado esperado:
- `_prisma_migrations`
- `users`
- `user_profiles`

---

## Orden recomendado para cambios de esquema (evitar errores)

1. Editar `prisma/schema.prisma`.
2. Ejecutar `npx prisma generate`.
3. Ejecutar `npx prisma migrate dev --name <nombre>`.
4. Si Prisma reporta **drift** en desarrollo local:
   - Ejecutar `npx prisma migrate reset --force`.
   - Ejecutar `npm run prisma:seed`.
5. Confirmar tablas con `\dt` en Postgres.

> Nota: `migrate reset` borra datos del entorno local. Es correcto para desarrollo; no usar así en producción.

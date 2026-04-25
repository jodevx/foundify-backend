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

---

## 3) Tabla `categories`

### Razón de ser
Catálogo de categorías de objetos para facilitar clasificación y búsqueda.

### Columnas

- **`id`** (`uuid`, PK)
- **`name`** (`text`, unique) — Nombre legible: "Electrónicos", "Documentos", etc.
- **`slug`** (`text`, unique) — Identificador URL-friendly: `electronica`, `mascotas`, etc.
- **`icon`** (`text`, nullable) — Emoji o código de ícono
- **`description`** (`text`, nullable)
- **`createdAt`** / **`updatedAt`** (`timestamp`)

### Índices / restricciones relevantes

- PK: `id`
- UNIQUE: `name`, `slug`

---

## 4) Tabla `items`

### Razón de ser
Publicaciones de objetos perdidos o encontrados. El tipo de publicación se codifica con el enum `ItemType`.

### Columnas

- **`id`** (`uuid`, PK)
- **`title`** (`text`, not null) — Título breve, 5–150 caracteres
- **`description`** (`text`, not null) — Descripción detallada, 20–2000 caracteres
- **`type`** (`ItemType` enum, not null)
  - `lost_item` — El usuario perdió el objeto ("Lo perdí")
  - `found_item` — El usuario encontró el objeto ("Quiero devolverlo")
- **`status`** (`text`, not null) — Estado según flujo de negocio (ver sección Enums de Status)
- **`categoryId`** (`uuid`, FK → `categories.id`, nullable)
- **`location`** (`text`, not null) — Lugar donde ocurrió (perdido/encontrado)
- **`eventDate`** (`timestamp`, not null) — Fecha del evento
- **`photoUrl`** (`text`, nullable) — URL pública de Cloudinary
- **`color`** (`text`, nullable) — Color del objeto
- **`material`** (`text`, nullable) — Material del objeto
- **`brand`** (`text`, nullable) — Marca
- **`userId`** (`uuid`, FK → `users.id`) — Dueño de la publicación
- **`deleted`** (`boolean`, default `false`) — Soft-delete
- **`createdAt`** / **`updatedAt`** (`timestamp`)

### Índices

- `@@index([userId])`
- `@@index([type])`
- `@@index([status])`
- `@@index([categoryId])`
- `@@index([type, status])`

---

## 5) Tabla `claims`

### Razón de ser
Reclamos enviados por usuarios que creen que un objeto `found_item` es suyo.

### Columnas

- **`id`** (`uuid`, PK)
- **`itemId`** (`uuid`, FK → `items.id`) — Item reclamado (solo tipo `found_item`)
- **`claimantId`** (`uuid`, FK → `users.id`) — Usuario que reclama
- **`claimMessage`** (`text`, not null) — Descripción de por qué cree que es suyo
- **`status`** (`ClaimStatus` enum) — `pendiente` | `aceptado` | `rechazado` | `cancelado`
- **`createdAt`** / **`updatedAt`** (`timestamp`)

### Restricciones de negocio (aplicadas en servicio)

- Solo se puede reclamar items de tipo `found_item`
- El dueño del item no puede reclamarlo
- El item no puede estar cerrado (`devuelto_propietario`, `entregado_autoridad`, `cerrado_sin_reclamo`)
- Un usuario solo puede tener un reclamo pendiente/aceptado por item

---

## Enum `ItemType`

Tipo de publicación. Los valores técnicos en BD son los valores del enum PostgreSQL.

| Valor BD | Etiqueta UI | Significado |
|----------|-------------|-------------|
| `lost_item` | 🔍 Lo perdí | El dueño reporta que perdió el objeto |
| `found_item` | ✨ Quiero devolverlo | Alguien encontró un objeto ajeno |

> ⚠️ **Nunca** usar strings `'perdido'` o `'encontrado'` — esos fueron los valores anteriores. Desde la migración `20260425000000_rename_item_type_values` se usan `lost_item` y `found_item`.

---

## Enums de Status

El estado de un item depende de su tipo:

### Estados para `lost_item`
| Status | Descripción |
|--------|-------------|
| `reportado_perdido` | Estado inicial al publicar |
| `en_validacion` | En proceso de verificación |
| `recuperado` | El dueño recuperó el objeto ✅ |
| `cerrado_sin_recuperar` | Cerrado sin recuperación |

### Estados para `found_item`
| Status | Descripción |
|--------|-------------|
| `reportado_encontrado` | Estado inicial al publicar |
| `en_resguardo` | El objeto está guardado seguro |
| `en_validacion` | Verificando reclamos |
| `devuelto_propietario` | Devuelto al dueño ✅ |
| `entregado_autoridad` | Entregado a autoridad competente |
| `cerrado_sin_reclamo` | Cerrado sin recibir reclamos |

### `ClaimStatus`
| Valor | Descripción |
|-------|-------------|
| `pendiente` | Reclamo enviado, esperando respuesta |
| `aceptado` | El dueño del item aceptó el reclamo |
| `rechazado` | El dueño rechazó el reclamo |
| `cancelado` | El reclamante canceló |

---

## Integración Cloudinary

Las imágenes de items se almacenan en Cloudinary. La BD guarda únicamente la URL pública.

- **Carpeta:** `foundify/items`
- **Campo en BD:** `items.photoUrl` (text, nullable)
- **Tamaño máximo:** 5 MB
- **Variable de entorno requerida:**
  ```env
  CLOUDINARY_CLOUD_NAME=tu_cloud
  CLOUDINARY_API_KEY=tu_api_key
  CLOUDINARY_API_SECRET=tu_api_secret
  ```

---

## Notas de seguridad

- `passwordHash` debe generarse con bcrypt (salt rounds >= 10).
- Nunca loggear contraseña ni hash en consola.
- Validar URL de foto con DTOs y `class-validator`.
- Mantener `JWT_SECRET` y credenciales Cloudinary fuera de repositorio (usar `.env`).

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

## Orden recomendado para cambios de esquema

1. Editar `prisma/schema.prisma`.
2. Ejecutar `npx prisma generate`.
3. Ejecutar `npx prisma migrate dev --name <nombre>`.
4. Si Prisma reporta **drift** en desarrollo local:
   - Ejecutar `npx prisma migrate reset --force`.
   - Ejecutar `npm run prisma:seed`.
5. Confirmar tablas con `\dt` en Postgres.

> Nota: `migrate reset` borra datos del entorno local. Es correcto para desarrollo; no usar así en producción.

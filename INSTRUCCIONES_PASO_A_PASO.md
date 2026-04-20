# 🚀 INSTRUCCIONES PASO A PASO - Foundify Backend

## Prerrequisitos
✅ Node.js instalado (v18 o superior)
✅ Docker Desktop instalado y corriendo
✅ Git Bash o PowerShell

---

## 💡 WORKFLOW DE DESARROLLO (Lee esto primero)

### ⏱️ Primera vez que levantas el proyecto (ejecutar TODOS los pasos):
```
PASO 1-2: Verificar Docker y navegar
PASO 3:   docker-compose up -d          ← Levantar PostgreSQL
PASO 4:   npx prisma generate            ← Generar cliente Prisma
PASO 5:   npm run prisma:migrate         ← Crear tablas en DB
PASO 6:   npm run prisma:seed            ← Crear usuario admin
PASO 7:   npm run start:dev              ← Iniciar servidor
```
⏳ Tiempo estimado: 5-10 minutos

---

### ☕ Desarrollo diario (PASOS que SÍ ejecutas cada día):
```bash
docker-compose down       # (Opcional) Solo si tuviste errores de contenedor
docker-compose up -d      # Levantar PostgreSQL
npm run start:dev         # Iniciar servidor
```
⏳ Tiempo estimado: 30 segundos

**💡 NO volver a ejecutar:** PASOS 4, 5, 6 (la DB ya está configurada)

---

### 🔧 Solo cuando CAMBIAS el schema de Prisma:
```bash
(editas prisma/schema.prisma)
npx prisma generate              # Regenerar cliente
npm run prisma:migrate           # Aplicar cambios a DB
npm run start:dev                # Reiniciar servidor
```

---

### ⚠️ Errores más comunes:
- **"Container name already in use"** → Olvidaste `docker-compose down`
- **"PrismaClient not exported"** → Olvidaste `npx prisma generate`
- **"Can't reach database"** → PostgreSQL no está corriendo (`docker ps`)
- **"Invalid credentials"** → No ejecutaste el seed o credenciales incorrectas

---

## 📋 PASOS PARA LEVANTAR EL BACKEND

### PASO 1: Verificar que Docker Desktop esté corriendo
```bash
# Abre Docker Desktop desde el menú de Windows
# Espera a que el ícono de Docker en la barra de tareas esté verde

# Verifica con este comando:
docker ps
```
✅ **Debe mostrar una tabla (puede estar vacía), no un error**

---

### PASO 2: Navegar al directorio del proyecto
```bash
cd C:\POLYRICS\FOUNDIFY_2026\foundify-backend
```

---

### PASO 3: Levantar PostgreSQL con Docker Compose

**⚠️ Si ya ejecutaste esto antes, primero limpia:**
```bash
docker-compose down
```

**Ahora levanta PostgreSQL:**
```bash
docker-compose up -d
```
✅ **Debe crear y levantar el contenedor `foundify-postgres`**

**Verificar que esté corriendo:**
```bash
docker ps
```
✅ **Debe aparecer `foundify-postgres` en la lista**

**💡 Nota:** El warning sobre `version` es obsoleto en Docker Compose, puedes ignorarlo.

---

### PASO 4: Generar el Cliente de Prisma
```bash
npx prisma generate
```
✅ **Debe mostrar:** `✔ Generated Prisma Client`

**💡 Nota:** Solo necesitas ejecutar esto la primera vez o cuando cambies `prisma/schema.prisma`

---

### PASO 5: Ejecutar las Migraciones de Base de Datos

**⚠️ SOLO ejecutar en estos casos:**
- ✅ Primera vez que configuras el proyecto
- ✅ Cuando modificas `prisma/schema.prisma` (agregar/cambiar modelos)
- ✅ Después de `npx prisma migrate reset`

**❌ NO ejecutar en desarrollo diario** (si no cambiaste el schema)

```bash
npm run prisma:migrate
```
- Te preguntará el nombre de la migración
- Escribe: `init` (o un nombre descriptivo del cambio)
- Presiona Enter

✅ **Debe crear la tabla `users` en PostgreSQL**

**💡 Nota:** Este comando crea las tablas en la base de datos según tu schema de Prisma.

---

### PASO 6: Ejecutar el Seed (Crear Usuario Admin)

**⚠️ SOLO ejecutar en estos casos:**
- ✅ Primera vez que configuras el proyecto
- ✅ Después de `npx prisma migrate reset` (borra la base de datos)
- ✅ Si borraste el usuario admin manualmente

**❌ NO ejecutar en desarrollo diario** (el usuario ya existe)

```bash
npm run prisma:seed
```
✅ **Debe mostrar:**
```
🌱 Starting seed...
✅ Admin user created: { id: '...', email: 'admin@example.com' }
📝 Login credentials:
   Email: admin@example.com
   Password: Admin12345!
```

**💡 Nota:** Si ejecutas el seed múltiples veces, mostrará "Admin user already exists. Skipping..." (es normal).

---

### PASO 7: Iniciar el Servidor de Desarrollo

**✅ EJECUTAR SIEMPRE** que quieras trabajar en el backend

```bash
npm run start:dev
```
✅ **Debe mostrar:**
```
✅ Database connected
🚀 Application is running on: http://localhost:3000
📚 Environment: development
```

**💡 Nota:** El servidor se reinicia automáticamente cuando guardas cambios en los archivos TypeScript.

**Para detener:** Presiona `Ctrl + C` en la terminal

---

## 🧪 PRUEBAS

### Prueba 1: Login (Obtener Token)
Abre otra terminal PowerShell y ejecuta:

```bash
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@example.com\",\"password\":\"Admin12345!\"}"
```

**Respuesta esperada:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI..."
}
```

### Prueba 2: Obtener Perfil (Ruta Protegida)
**Copia el `accessToken` de la respuesta anterior** y reemplázalo en el siguiente comando:

```bash
curl -X GET http://localhost:3000/me -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI"
```

**Respuesta esperada:**
```json
{
  "id": "uuid-del-usuario",
  "email": "admin@example.com",
  "createdAt": "2026-04-19T...",
  "updatedAt": "2026-04-19T..."
}
```

---

## ❌ SOLUCIÓN DE PROBLEMAS

### Error: "The container name is already in use"
**Error completo:**
```
Error response from daemon: Conflict. The container name "/foundify-postgres" 
is already in use by container "26cce1397b6d..."
```

**¿Qué pasó?**
Ya existe un contenedor con el mismo nombre de una ejecución anterior. Docker no permite duplicar nombres de contenedor.

**Solución:**
```bash
# Opción 1: Usar docker-compose para limpiarlo
docker-compose down

# Opción 2: Si lo anterior no funciona, eliminar manualmente
docker rm -f foundify-postgres

# Luego volver a crear
docker-compose up -d
```

**Para evitarlo en el futuro:** Siempre ejecuta `docker-compose down` antes de `docker-compose up -d`

---

### Error: "Docker not found" o "cannot connect to Docker"
**Solución:** Abre Docker Desktop y espera a que inicie completamente (ícono verde en la barra de tareas)

### Error: "port 5432 is already allocated"
**Solución:** Ya tienes PostgreSQL corriendo en ese puerto
```bash
# Detén el contenedor actual
docker-compose down

# O cambia el puerto en docker-compose.yml de 5432:5432 a 5433:5432
# Y actualiza DATABASE_URL en .env a: ...@localhost:5433/foundify...
```

### Error: "PrismaClient" no exportado
**Solución:** No ejecutaste `npx prisma generate`
```bash
npx prisma generate
```

### Error: "Invalid credentials" al hacer login
**Solución:** No ejecutaste el seed o las credenciales son incorrectas
```bash
npm run prisma:seed
```
Credenciales: `admin@example.com` / `Admin12345!`

### Error: "Can't reach database server"
**Solución:** PostgreSQL no está corriendo
```bash
docker-compose up -d
docker ps  # Verifica que foundify-postgres esté corriendo
```

### Error: Token expirado (Unauthorized en /me)
**Solución:** El JWT expira en 15 minutos. Haz login nuevamente para obtener un nuevo token.

---

## 🛑 DETENER EL BACKEND

### Detener el servidor NestJS
En la terminal donde corre `npm run start:dev`:
- Presiona `Ctrl + C`

### Detener PostgreSQL
```bash
docker-compose down
```

### Ver logs de PostgreSQL
```bash
docker-compose logs -f
```

---

## 🔄 PRÓXIMA VEZ (REINICIAR EL BACKEND)

Si ya ejecutaste todos los pasos antes, solo necesitas:

### 1. Limpiar y levantar PostgreSQL (recomendado)
```bash
# Detener contenedores previos (evita conflictos)
docker-compose down

# Levantar PostgreSQL
docker-compose up -d
```

**O simplemente (si no tuviste el contenedor corriendo):**
```bash
docker-compose up -d
```

### 2. Iniciar el servidor
```bash
npm run start:dev
```

✅ ¡Listo! El backend estará en `http://localhost:3000`

---

## 📊 COMANDOS ÚTILES

### Gestión de Docker
```bash
# Ver contenedores activos
docker ps

# Ver TODOS los contenedores (activos e inactivos)
docker ps -a

# Ver logs de PostgreSQL
docker-compose logs -f

# Detener PostgreSQL
docker-compose down

# Detener PostgreSQL y eliminar volúmenes (BORRA DATOS)
docker-compose down -v

# Eliminar un contenedor específico por la fuerza
docker rm -f foundify-postgres

# Reiniciar el contenedor de PostgreSQL
docker restart foundify-postgres
```

### Gestión de Prisma
```bash
# Ver la base de datos con una GUI
npx prisma studio

# Resetear la base de datos (BORRA TODOS LOS DATOS)
npx prisma migrate reset

# Ver estado de las migraciones
npx prisma migrate status

# Generar cliente de Prisma después de cambios en schema
npx prisma generate

# Crear una nueva migración
npm run prisma:migrate
```

### Diagnóstico
```bash
# Ver si el puerto 5432 está en uso
netstat -ano | findstr :5432

# Ver versión de Node
node --version

# Ver versión de npm
npm --version

# Limpiar caché de npm
npm cache clean --force
```

---

## 🔑 CREDENCIALES POR DEFECTO

```
Email:    admin@example.com
Password: Admin12345!
```

---

## ✅ CHECKLIST RÁPIDO DE VERIFICACIÓN

Antes de empezar a desarrollar, verifica:

```bash
# 1. Docker Desktop está corriendo
docker ps
# ✅ Debe mostrar tabla, no error

# 2. PostgreSQL está activo
docker ps | findstr foundify-postgres
# ✅ Debe mostrar: foundify-postgres ... Up

# 3. Prisma Client está generado
ls node_modules\.prisma\client
# ✅ Debe mostrar archivos de Prisma

# 4. Migraciones aplicadas
npm run prisma:migrate status
# ✅ No debe mostrar migraciones pendientes

# 5. Usuario admin existe
# Intenta hacer login (ver sección PRUEBAS arriba)
```

---

## 📁 ARCHIVOS IMPORTANTES

- `.env` - Variables de entorno (DATABASE_URL, JWT_SECRET)
- `docker-compose.yml` - Configuración de PostgreSQL
- `prisma/schema.prisma` - Modelos de base de datos
- `prisma/seed.ts` - Script para crear usuario admin
- `src/main.ts` - Punto de entrada de la aplicación

---

## 🔐 SEGURIDAD

⚠️ **IMPORTANTE PARA PRODUCCIÓN:**
1. Cambia `JWT_SECRET` en `.env`
2. Usa contraseñas fuertes
3. Cambia las credenciales de PostgreSQL
4. NO subas el archivo `.env` a Git
5. Usa variables de entorno del servidor en producción

---

## 📊 TABLA RESUMEN: ¿CUÁNDO EJECUTAR CADA PASO?

| Paso | Comando | Primera Vez | Diario | Cambio Schema | Después Reset |
|------|---------|:-----------:|:------:|:-------------:|:-------------:|
| **1-2** | Verificar Docker | ✅ | ✅ | ✅ | ✅ |
| **3** | `docker-compose up -d` | ✅ | ✅ | ✅ | ✅ |
| **4** | `npx prisma generate` | ✅ | ❌ | ✅ | ✅ |
| **5** | `npm run prisma:migrate` | ✅ | ❌ | ✅ | ✅ |
| **6** | `npm run prisma:seed` | ✅ | ❌ | ❌ | ✅ |
| **7** | `npm run start:dev` | ✅ | ✅ | ✅ | ✅ |

**Leyenda:**
- **Primera Vez**: Setup inicial del proyecto
- **Diario**: Cuando trabajas día a día sin cambios en DB
- **Cambio Schema**: Modificaste `prisma/schema.prisma`
- **Después Reset**: Ejecutaste `npx prisma migrate reset`

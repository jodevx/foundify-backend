# Foundify Backend - NestJS API

Backend NestJS con PostgreSQL, Prisma ORM y autenticación JWT.

## 🛠️ Stack Tecnológico

- **NestJS** + TypeScript
- **PostgreSQL** (Docker Compose)
- **Prisma ORM**
- **@nestjs/config** para variables de entorno
- **@nestjs/passport** + **passport-jwt** para autenticación
- **bcrypt** para hashing de contraseñas

## 📁 Arquitectura del Proyecto

```
src/
├── main.ts                     # Punto de entrada de la aplicación
├── app.module.ts              # Módulo raíz
├── prisma/                    # Módulo de Prisma
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── shared/                    # Código compartido
│   └── crypto/
│       ├── password-hasher.interface.ts
│       └── bcrypt-password-hasher.ts
└── modules/
    ├── auth/                  # Módulo de autenticación
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── dto/
    │   │   ├── login.dto.ts
    │   │   └── login-response.dto.ts
    │   ├── interfaces/
    │   │   ├── jwt-payload.interface.ts
    │   │   └── token-service.interface.ts
    │   ├── services/
    │   │   └── jwt-token.service.ts
    │   ├── strategies/
    │   │   └── jwt.strategy.ts
    │   └── guards/
    │       └── jwt-auth.guard.ts
    └── users/                 # Módulo de usuarios
        ├── users.module.ts
        ├── users.controller.ts
        ├── users.service.ts
        ├── entities/
        │   └── user.entity.ts
        ├── dto/
        │   └── user-response.dto.ts
        └── repositories/
            ├── users.repository.interface.ts
            └── prisma-users.repository.ts
```

## 🚀 Instalación y Configuración

### 1. Clonar e Instalar Dependencias

Las dependencias ya están instaladas. Si necesitas reinstalar:

```bash
npm install
```

### 2. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

El archivo `.env` ya está configurado con:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/foundify?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"
PORT=3000
NODE_ENV="development"

# Cloudinary (para upload de imágenes)
CLOUDINARY_CLOUD_NAME=tu_cloud
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

⚠️ **IMPORTANTE**: Cambia el `JWT_SECRET` en producción.

### 3. Levantar Base de Datos (PostgreSQL)

```bash
docker-compose up -d
```

Verifica que el contenedor esté corriendo:

```bash
docker ps
```

### 4. Generar Cliente de Prisma

```bash
npx prisma generate
```

### 5. Ejecutar Migraciones

```bash
npm run prisma:migrate
```

Cuando te pregunte por el nombre de la migración, puedes usar: `init`

### 6. Ejecutar Seed (Usuario Admin)

```bash
npm run prisma:seed
```

Esto creará el usuario administrador:
- **Email**: `admin@example.com`
- **Password**: `Admin12345!`

### 7. Iniciar el Servidor

```bash
npm run start:dev
```

El servidor estará disponible en: `http://localhost:3000`

## 📡 Endpoints Disponibles

### Auth

**POST** `/auth/register`
```json
{ "email": "user@example.com", "password": "Secure123!", "firstName": "Ana", "firstLastName": "García", "gender": "FEMALE" }
```

**POST** `/auth/login`
```json
{ "email": "admin@example.com", "password": "Admin12345!" }
// Respuesta: { "accessToken": "eyJ..." }
```

**POST** `/auth/logout` — (requiere JWT)

**GET** `/me` — Perfil del usuario autenticado (requiere JWT)

---

### Categories (público)

**GET** `/categories` — Lista de categorías disponibles

```json
[
  { "id": "uuid", "name": "Electrónicos", "slug": "electronica", "icon": "📱" },
  ...
]
```

---

### Items (publicaciones)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/items` | No | Listar con filtros y paginación |
| GET | `/items/:id` | No | Ver detalle |
| POST | `/items` | Sí | Crear publicación |
| PUT | `/items/:id` | Sí | Editar publicación |
| PATCH | `/items/:id/status` | Sí | Cambiar estado |
| DELETE | `/items/:id` | Sí | Eliminar (soft-delete) |

**Filtros GET `/items`:** `type`, `category`, `status`, `search`, `page`, `limit`

**Tipos de publicación (`type`):**
- `lost_item` — "Lo perdí" (UI: "🔍 Lo perdí")
- `found_item` — "Quiero devolverlo" (UI: "✨ Quiero devolverlo")

**Crear publicación** (`multipart/form-data`):
```bash
curl -X POST http://localhost:3000/items \
  -H "Authorization: Bearer <TOKEN>" \
  -F "title=Cartera negra" \
  -F "description=Cartera de cuero encontrada en metro Insurgentes" \
  -F "type=found_item" \
  -F "categorySlug=accesorios" \
  -F "location=Metro Insurgentes, CDMX" \
  -F "eventDate=2026-04-25" \
  -F "photo=@/ruta/a/foto.jpg"
```

---

### Claims (reclamos)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/items/:id/claims` | Sí | Enviar reclamo "¿es mío?" |
| GET | `/items/:id/claims` | Sí (dueño) | Ver reclamos recibidos |
| PATCH | `/items/:id/claims/:claimId` | Sí (dueño) | Aceptar / rechazar reclamo |

```json
// POST /items/:id/claims
{ "claimMessage": "Es mi cartera azul, adentro tiene mi CURP y una foto de mi perro" }

// PATCH /items/:id/claims/:claimId
{ "action": "aceptado" }  // o "rechazado"
```

---
```

## 🗂️ Scripts Disponibles

```bash
npm run build           # Compilar TypeScript
npm run start           # Iniciar en producción
npm run start:dev       # Iniciar en desarrollo
npm run prisma:migrate  # Crear/aplicar migraciones
npm run prisma:generate # Generar cliente Prisma
npm run prisma:seed     # Ejecutar seed
npm run prisma:studio   # Abrir Prisma Studio (GUI)
```

## 🔧 Comandos Útiles de Prisma

```bash
# Ver la base de datos en una GUI
npx prisma studio

# Resetear la base de datos (elimina todos los datos)
npx prisma migrate reset

# Ver el estado de las migraciones
npx prisma migrate status
```

## 📦 Modelo de Datos (principales)

```prisma
enum ItemType {
  lost_item   // "Lo perdí" — el dueño reporta pérdida
  found_item  // "Quiero devolverlo" — alguien encontró un objeto ajeno
}

model Item {
  id          String    @id @default(uuid())
  title       String
  description String    @db.Text
  type        ItemType
  status      String
  categoryId  String?
  category    Category? @relation(...)
  location    String
  eventDate   DateTime
  photoUrl    String?   @db.Text   // URL Cloudinary
  color       String?
  material    String?
  brand       String?
  userId      String
  deleted     Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("items")
}

model Category {
  id    String  @id @default(uuid())
  name  String  @unique
  slug  String  @unique
  icon  String?

  @@map("categories")
}

model Claim {
  id           String   @id @default(uuid())
  itemId       String
  claimantId   String
  claimMessage String   @db.Text
  status       String   @default("pendiente")
  createdAt    DateTime @default(now())

  @@map("claims")
}
```

## 🔐 Seguridad Implementada

- ✅ Hashing de contraseñas con bcrypt (10 rounds)
- ✅ JWT con expiración (15 minutos por defecto)
- ✅ Mensajes de error genéricos ("Invalid credentials")
- ✅ Validación de DTOs con class-validator
- ✅ Guards para proteger rutas
- ✅ No se loggean contraseñas

## 🔮 Cómo Extender la Arquitectura

### Agregar Registro de Usuarios

1. **Crear DTO de registro:**
```typescript
// src/modules/auth/dto/register.dto.ts
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

2. **Agregar método en UsersRepository:**
```typescript
// Agregar a la interfaz
create(email: string, passwordHash: string): Promise<User>;

// Implementar en PrismaUsersRepository
async create(email: string, passwordHash: string): Promise<User> {
  return this.prisma.user.create({
    data: { email, passwordHash },
  });
}
```

3. **Agregar método en AuthService:**
```typescript
async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
  // Validar que el email no exista
  const existing = await this.usersService.findByEmail(registerDto.email);
  if (existing) {
    throw new ConflictException('Email already exists');
  }

  // Hash password
  const passwordHash = await this.passwordHasher.hash(registerDto.password);

  // Crear usuario
  const user = await this.usersRepository.create(registerDto.email, passwordHash);

  // Generar token
  const accessToken = await this.tokenService.generateAccessToken(user.id, user.email);

  return new LoginResponseDto(accessToken);
}
```

4. **Agregar endpoint en AuthController:**
```typescript
@Post('register')
async register(@Body() registerDto: RegisterDto): Promise<LoginResponseDto> {
  return this.authService.register(registerDto);
}
```

### Agregar Forgot/Reset Password

1. **Crear tabla de tokens:**
```prisma
model PasswordResetToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@map("password_reset_tokens")
}
```

2. **Crear endpoint `/auth/forgot-password`** que:
   - Genera un token único
   - Lo guarda en la base de datos con expiración
   - Envía email con link de reset (integrar servicio de email)

3. **Crear endpoint `/auth/reset-password`** que:
   - Valida el token
   - Verifica que no esté usado ni expirado
   - Actualiza la contraseña
   - Marca el token como usado

### Cambiar de bcrypt a argon2

Solo necesitas crear una nueva implementación de `PasswordHasher`:

```typescript
// src/shared/crypto/argon2-password-hasher.ts
export class Argon2PasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword);
  }

  async compare(plainPassword: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plainPassword);
  }
}
```

Luego reemplazar en `AuthModule`:
```typescript
providers: [
  // ... otros providers
  { provide: PasswordHasher, useClass: Argon2PasswordHasher },
]
```

### Cambiar de JWT a Sesiones/OIDC

Gracias a la interfaz `TokenService`, puedes crear implementaciones alternativas sin cambiar el `AuthService`. Solo crea una nueva clase que implemente `TokenService` y cámbiala en el módulo.

## 📝 Notas

- El JWT expira en 15 minutos por defecto (configurable en `.env`)
- La base de datos se persiste en un volumen de Docker
- El seed es idempotente (no duplica el admin si ya existe)

## 🐛 Troubleshooting

### Error: "Can't reach database server"
- Verifica que Docker esté corriendo: `docker ps`
- Verifica que PostgreSQL esté en el puerto 5432

### Error: "Invalid credentials"
- Verifica que hayas ejecutado el seed
- Verifica las credenciales: `admin@example.com` / `Admin12345!`

### Error: "Unauthorized" en /me
- Verifica que el token no haya expirado (15 min)
- Verifica el formato del header: `Authorization: Bearer <token>`

## 📄 Licencia

ISC

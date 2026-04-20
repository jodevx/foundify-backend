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

### 1. Login

**POST** `/auth/login`

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"Admin12345!\"}"
```

**Respuesta exitosa (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta de error (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### 2. Obtener Perfil (Protegido)

**GET** `/me`

```bash
curl -X GET http://localhost:3000/me \
  -H "Authorization: Bearer <TU_ACCESS_TOKEN>"
```

**Respuesta exitosa (200):**
```json
{
  "id": "uuid-del-usuario",
  "email": "admin@example.com",
  "createdAt": "2026-04-06T...",
  "updatedAt": "2026-04-06T..."
}
```

**Respuesta sin token (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

## 🧪 Prueba Completa

1. **Login y obtener token:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"Admin12345!\"}"
```

2. **Copia el accessToken de la respuesta**

3. **Usar el token para acceder a /me:**
```bash
curl -X GET http://localhost:3000/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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

## 📦 Modelo de Datos

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
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

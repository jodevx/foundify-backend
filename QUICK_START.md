# 🚀 QUICK START - Foundify Backend

## Pasos para levantar el proyecto (primera vez):

### 1. Levantar PostgreSQL
```bash
docker-compose up -d
```

### 2. Generar cliente Prisma
```bash
npx prisma generate
```

### 3. Ejecutar migraciones
```bash
npm run prisma:migrate
```
(Cuando pregunte el nombre, usa: `init`)

### 4. Ejecutar seed (crear admin)
```bash
npm run prisma:seed
```

### 5. Iniciar servidor
```bash
npm run start:dev
```

---

## Credenciales del usuario admin:
- **Email**: admin@example.com
- **Password**: Admin12345!

---

## Prueba rápida:

### Login:
```bash
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@example.com\",\"password\":\"Admin12345!\"}"
```

### Get Me (reemplaza <TOKEN> con el accessToken obtenido):
```bash
curl -X GET http://localhost:3000/me -H "Authorization: Bearer <TOKEN>"
```

---

## Comandos útiles:

```bash
# Ver BD en GUI
npx prisma studio

# Resetear BD (borra todo)
npx prisma migrate reset

# Ver logs de Docker
docker-compose logs -f

# Detener PostgreSQL
docker-compose down
```

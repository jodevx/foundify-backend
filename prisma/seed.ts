import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/foundify?schema=public';

const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Admin user credentials
  const adminEmail = 'admin@example.com';
  const adminPassword = 'Admin12345!';
  const saltRounds = 10;

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists. Skipping user creation...');
  } else {
    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
      },
    });

    console.log(`✅ Admin user created:`, {
      id: admin.id,
      email: admin.email,
    });
    console.log(`📝 Login credentials:`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
  }

  // Seed categories
  const categories = [
    { name: 'Documentos y Tarjetas',         slug: 'documentos_y_tarjetas',       icon: '🪪', description: 'INE, pasaportes, tarjetas de crédito/débito, credenciales' },
    { name: 'Llaves y Controles',             slug: 'llaves_y_controles',           icon: '🔑', description: 'Llaves de auto, casa, control remoto de garage' },
    { name: 'Telefonía y Tablets',            slug: 'telefonia_y_tablets',          icon: '📱', description: 'Celulares, smartphones, tablets, e-readers' },
    { name: 'Cómputo y Accesorios',           slug: 'computo_y_accesorios',         icon: '💻', description: 'Laptops, audífonos, ratones, teclados, cargadores, USB' },
    { name: 'Billeteras y Bolsos',            slug: 'billeteras_y_bolsos',          icon: '👜', description: 'Carteras, bolsas de mano, mochilas, portafolios' },
    { name: 'Joyas y Relojes',                slug: 'joyas_y_relojes',              icon: '💍', description: 'Anillos, collares, pulseras, aretes, relojes' },
    { name: 'Ropa y Calzado',                 slug: 'ropa_y_calzado',               icon: '👟', description: 'Ropa, chamarras, zapatos, gorras, bufandas' },
    { name: 'Lentes y Dispositivos Médicos',  slug: 'lentes_y_dispositivos_medicos',icon: '👓', description: 'Lentes de graduación, audífonos auditivos, bastones' },
    { name: 'Mascotas',                       slug: 'mascotas',                     icon: '🐾', description: 'Perros, gatos u otras mascotas' },
    { name: 'Equipaje',                       slug: 'equipaje',                     icon: '🧳', description: 'Maletas, petacas, bolsas de viaje' },
    { name: 'Artículos Deportivos',           slug: 'articulos_deportivos',         icon: '⚽', description: 'Pelotas, raquetas, bicicletas, patines, guantes' },
    { name: 'Otros',                          slug: 'otros',                        icon: '📦', description: 'Cualquier objeto que no encaje en las categorías anteriores' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${categories.length} categorías sembradas.`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

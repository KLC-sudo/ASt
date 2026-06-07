import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'change-me-immediately-1234';

  const hashedPassword = await bcrypt.hash(password, 12);
  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, hashedPassword, name: 'Owner', role: 'OWNER' },
  });

  console.log(`[seed] admin ready: ${admin.email} (id ${admin.id})`);
  console.log(`[seed] password: ${password}`);
  console.log('[seed] change this password after first login.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

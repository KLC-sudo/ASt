import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Auto-seed admin user if none exists
async function seedAdmin() {
  try {
    const count = await prisma.adminUser.count();
    if (count > 0) return;

    const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.SEED_ADMIN_PASSWORD || 'change-me-immediately-1234';
    const hashed = await bcrypt.hash(password, 12);

    await prisma.adminUser.create({
      data: { email, hashedPassword: hashed, name: 'Owner', role: 'OWNER' },
    });
    console.log(`[seed] Admin created: ${email}`);
  } catch (e) {
    console.error('[seed] Auto-seed failed:', e);
  }
}

seedAdmin();

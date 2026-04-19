// createAdmin.js — Create admin account from environment variables
// Usage: ADMIN_EMAIL=you@org.tn ADMIN_PASSWORD=your-secure-password node createAdmin.js

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables');
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 12) {
    console.error('ADMIN_PASSWORD must be at least 12 characters');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const adminUser = await prisma.admin.upsert({
    where: { email: ADMIN_EMAIL },
    update: { name: ADMIN_NAME, hashedPassword },
    create: { email: ADMIN_EMAIL, name: ADMIN_NAME, hashedPassword, role: 'superadmin' },
  });

  console.log(`Admin created/updated: ${adminUser.email}`);
}

main()
  .catch(() => process.exit(1))
  .finally(() => prisma.$disconnect());

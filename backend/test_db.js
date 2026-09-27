require('dotenv').config();
const prisma = require('./src/config/db');

async function test() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    const count = await prisma.user.count();
    console.log('Prisma user count:', count);
    const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
    console.log('Users in DB:', users);
  } catch (err) {
    console.error('Database query error:', err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

test();

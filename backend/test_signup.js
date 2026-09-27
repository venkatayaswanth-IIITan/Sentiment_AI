require('dotenv').config();
const authService = require('./src/services/authService');
const prisma = require('./src/config/db');

async function test() {
  try {
    console.log('Testing signup with authService...');
    const result = await authService.signup({
      name: 'Demo User',
      email: 'demo@sentimentai.com',
      password: 'Password123!'
    });
    console.log('Signup SUCCESS:', result.user);
    console.log('Token generated:', result.token ? 'YES' : 'NO');

    const signinResult = await authService.signin({
      email: 'demo@sentimentai.com',
      password: 'Password123!'
    });
    console.log('Signin SUCCESS:', signinResult.user);
  } catch (err) {
    console.error('Auth error:', err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

test();

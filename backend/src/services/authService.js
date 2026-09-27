const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'brandpulse_jwt_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthService {
  async signup({ email, password, name, userAgent, ipAddress }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      const err = new Error('An account with this email already exists.');
      err.statusCode = 409;
      throw err;
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userName = name ? name.trim() : normalizedEmail.split('@')[0];
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`;

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: userName,
        avatarUrl,
        role: 'USER',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });

    // Create JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Save session in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt,
      },
    });

    return { token, user };
  }

  async signin({ email, password, userAgent, ipAddress }) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('This account has been deactivated.');
      err.statusCode = 403;
      throw err;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Save session in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt,
      },
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  async signout(token) {
    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }
    return { success: true, message: 'Logged out successfully.' };
  }
}

module.exports = new AuthService();

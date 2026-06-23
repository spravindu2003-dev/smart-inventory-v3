const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const prisma = require('../utils/prisma');
const config = require('../config/env');
const { logAction } = require('../utils/activityLogger');
const { sendPasswordResetEmail } = require('../utils/mail');
const asyncHandler = require('../utils/asyncHandler');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existing) return res.status(409).json({ message: 'Username or email already exists' });

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword, role: 'owner' },
  });

  await logAction({
    userId: req.user.id,
    action: 'REGISTER_USER',
    entity: 'User',
    entityId: user.id,
    description: `Registered user ${username} as owner`,
  });

  const token = generateToken(user);

  res.status(201).json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  });
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    await logAction({
      userId: 0,
      action: 'LOGIN_FAILED',
      entity: 'User',
      description: `Failed login attempt for ${email}`,
    });
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!user.isActive) {
    await logAction({
      userId: user.id,
      action: 'LOGIN_FAILED',
      entity: 'User',
      entityId: user.id,
      description: `Disabled account login attempt for ${user.username}`,
    });
    return res.status(403).json({ message: 'Account disabled' });
  }

  await logAction({
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    entity: 'User',
    entityId: user.id,
    description: `User ${user.username} logged in`,
  });

  const token = generateToken(user);

  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  });
};

exports.getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, username: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
  });

  if (!user) return res.status(404).json({ message: 'User not found' });

  res.json({ user });
};

exports.changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });

  await logAction({
    userId: req.user.id,
    action: 'PASSWORD_CHANGED',
    entity: 'User',
    entityId: req.user.id,
    description: `User ${user.username} changed password`,
  });

  res.json({ message: 'Password changed successfully' });
};

exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.json({ message: 'If an account with that email exists, a password reset link has been sent' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashedToken,
      resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  await logAction({
    userId: user.id,
    action: 'PASSWORD_RESET_REQUESTED',
    entity: 'User',
    entityId: user.id,
    description: `Password reset requested for ${user.username}`,
  });

  await sendPasswordResetEmail(user.email, user.username, resetToken);

  res.json({ message: 'If an account with that email exists, a password reset link has been sent' });
};

exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { password } = req.body;
  const { token } = req.params;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: { gte: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  await logAction({
    userId: user.id,
    action: 'PASSWORD_RESET_COMPLETED',
    entity: 'User',
    entityId: user.id,
    description: `Password reset completed for ${user.username}`,
  });

  res.json({ message: 'Password reset successful' });
};

Object.keys(module.exports).forEach((key) => {
  module.exports[key] = asyncHandler(module.exports[key]);
});

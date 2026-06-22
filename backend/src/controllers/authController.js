const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const prisma = require('../utils/prisma');
const config = require('../config/env');
const { logAction } = require('../utils/activityLogger');
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

  const { username, email, password, role } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existing) return res.status(409).json({ message: 'Username or email already exists' });

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword, role },
  });

  await logAction({
    userId: req.user.id,
    action: 'REGISTER_USER',
    entity: 'User',
    entityId: user.id,
    description: `Registered user ${username} as ${role}`,
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
    select: { id: true, username: true, email: true, role: true, createdAt: true },
  });

  if (!user) return res.status(404).json({ message: 'User not found' });

  res.json({ user });
};

Object.keys(module.exports).forEach((key) => {
  module.exports[key] = asyncHandler(module.exports[key]);
});

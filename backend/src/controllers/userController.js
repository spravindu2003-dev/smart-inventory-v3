const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const { logAction } = require('../utils/activityLogger');
const asyncHandler = require('../utils/asyncHandler');

exports.getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, username: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
};

exports.getAll = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
  const search = req.query.search || '';
  const roleFilter = req.query.role || '';

  const where = { deletedAt: null };

  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (roleFilter && ['owner', 'manager', 'cashier'].includes(roleFilter)) {
    where.role = roleFilter;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

exports.create = async (req, res) => {
  const { username, email, password, firstName, lastName, role } = req.body;

  console.log('[USER_CREATE] Request body:', JSON.stringify(req.body));

  if (!username || !email || !password || !role) {
    console.log('[USER_CREATE] Missing required fields');
    return res.status(400).json({ message: 'All fields are required: username, email, password, role' });
  }

  if (!['manager', 'cashier'].includes(role)) {
    console.log('[USER_CREATE] Invalid role:', role);
    return res.status(400).json({ message: 'Role must be manager or cashier' });
  }

  if (password.length < 6) {
    console.log('[USER_CREATE] Password too short');
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existing) {
    console.log('[USER_CREATE] Duplicate username or email:', { username, email });
    return res.status(409).json({ message: 'Username or email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
      role,
    },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  console.log('[USER_CREATE] User created successfully:', { id: user.id, username: user.username, role: user.role });

  await logAction({
    userId: req.user.id,
    action: 'USER_CREATED',
    entity: 'User',
    entityId: user.id,
    description: `Created user ${username} as ${role}`,
  });

  res.status(201).json({ user });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  const { firstName, lastName, email, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (email && email !== existing.email) {
    const dup = await prisma.user.findUnique({ where: { email } });
    if (dup) return res.status(409).json({ message: 'Email already in use' });
  }

  if (role && !['owner', 'manager', 'cashier'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      firstName: firstName !== undefined ? firstName : existing.firstName,
      lastName: lastName !== undefined ? lastName : existing.lastName,
      email: email ?? existing.email,
      role: role ?? existing.role,
    },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  await logAction({
    userId: req.user.id,
    action: 'USER_UPDATED',
    entity: 'User',
    entityId: id,
    description: `Updated user ${user.username}`,
  });

  res.json({ user });
};

exports.toggleStatus = async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (existing.id === req.user.id) {
    return res.status(400).json({ message: 'Cannot deactivate your own account' });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: !existing.isActive },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  const action = user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED';
  await logAction({
    userId: req.user.id,
    action,
    entity: 'User',
    entityId: id,
    description: `${user.isActive ? 'Activated' : 'Deactivated'} user ${user.username}`,
  });

  res.json({ user });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (existing.id === req.user.id) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }

  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  await logAction({
    userId: req.user.id,
    action: 'DELETE_USER',
    entity: 'User',
    entityId: id,
    description: `Deleted user ${existing.username}`,
  });

  res.json({ message: 'User deleted' });
};

exports.updateMe = async (req, res) => {
  const { firstName, lastName, email } = req.body;

  const existing = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!existing) return res.status(404).json({ message: 'User not found' });

  const updates = {};
  let emailChanged = false;

  if (firstName !== undefined) updates.firstName = firstName || null;
  if (lastName !== undefined) updates.lastName = lastName || null;

  if (email !== undefined && email !== existing.email) {
    const dup = await prisma.user.findUnique({ where: { email } });
    if (dup) return res.status(409).json({ message: 'Email already in use' });
    updates.email = email;
    emailChanged = true;
  }

  if (Object.keys(updates).length === 0) {
    return res.json({ user: existing });
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: updates,
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });

  if (emailChanged) {
    await logAction({
      userId: req.user.id,
      action: 'EMAIL_CHANGED',
      entity: 'User',
      entityId: req.user.id,
      description: `User ${user.username} changed email to ${user.email}`,
    });
  }

  await logAction({
    userId: req.user.id,
    action: 'PROFILE_UPDATED',
    entity: 'User',
    entityId: req.user.id,
    description: `User ${user.username} updated profile`,
  });

  res.json({ user });
};

Object.keys(module.exports).forEach((key) => {
  module.exports[key] = asyncHandler(module.exports[key]);
});

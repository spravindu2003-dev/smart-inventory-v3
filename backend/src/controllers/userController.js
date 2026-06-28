const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const { logAction } = require('../utils/activityLogger');
const asyncHandler = require('../utils/asyncHandler');

exports.getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
};

exports.getAll = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
  const search = req.query.search || '';
  const roleFilter = req.query.role || '';

  const where = { isDeleted: false, businessId: req.user.businessId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
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
        name: true,
        email: true,
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
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required: name, email, password, role' });
  }

  if (!['manager', 'cashier'].includes(role)) {
    return res.status(400).json({ message: 'Role must be manager or cashier' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      businessId: req.user.businessId,
      createdById: req.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  await logAction({
    userId: req.user.id,
    businessId: req.user.businessId,
    action: 'USER_CREATED',
    entity: 'User',
    entityId: user.id,
    description: `Created user ${name} as ${role}`,
  });

  res.status(201).json({ user });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, role } = req.body;

  const existing = await prisma.user.findFirst({ where: { id, businessId: req.user.businessId } });
  if (!existing || existing.isDeleted) {
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
      name: name ?? existing.name,
      email: email ?? existing.email,
      role: role ?? existing.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  await logAction({
    userId: req.user.id,
    businessId: req.user.businessId,
    action: 'USER_UPDATED',
    entity: 'User',
    entityId: id,
    description: `Updated user ${user.name}`,
  });

  res.json({ user });
};

exports.toggleStatus = async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.user.findFirst({ where: { id, businessId: req.user.businessId } });
  if (!existing || existing.isDeleted) {
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
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  const action = user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED';
  await logAction({
    userId: req.user.id,
    businessId: req.user.businessId,
    action,
    entity: 'User',
    entityId: id,
    description: `${user.isActive ? 'Activated' : 'Deactivated'} user ${user.name}`,
  });

  res.json({ user });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.user.findFirst({ where: { id, businessId: req.user.businessId } });
  if (!existing || existing.isDeleted) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (existing.id === req.user.id) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }

  await prisma.user.update({
    where: { id },
    data: { isDeleted: true, isActive: false, deletedAt: new Date() },
  });

  await logAction({
    userId: req.user.id,
    businessId: req.user.businessId,
    action: 'DELETE_USER',
    entity: 'User',
    entityId: id,
    description: `Deleted user ${existing.name}`,
  });

  res.json({ message: 'User deleted' });
};

exports.updateMe = async (req, res) => {
  const { name, email } = req.body;

  const existing = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!existing) return res.status(404).json({ message: 'User not found' });

  const updates = {};
  let emailChanged = false;

  if (name !== undefined) updates.name = name;

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
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (emailChanged) {
    await logAction({
      userId: req.user.id,
      businessId: req.user.businessId,
      action: 'EMAIL_CHANGED',
      entity: 'User',
      entityId: req.user.id,
      description: `User ${user.name} changed email to ${user.email}`,
    });
  }

  await logAction({
    userId: req.user.id,
    businessId: req.user.businessId,
    action: 'PROFILE_UPDATED',
    entity: 'User',
    entityId: req.user.id,
    description: `User ${user.name} updated profile`,
  });

  res.json({ user });
};

Object.keys(module.exports).forEach((key) => {
  module.exports[key] = asyncHandler(module.exports[key]);
});

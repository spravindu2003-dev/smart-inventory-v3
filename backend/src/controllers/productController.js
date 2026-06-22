const { validationResult } = require('express-validator');
const prisma = require('../utils/prisma');
const { logAction } = require('../utils/activityLogger');
const asyncHandler = require('../utils/asyncHandler');

exports.getAll = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count(),
  ]);

  res.json({
    data: products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

exports.getById = async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: Number(req.params.id) } });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ product });
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description, price, stock, sku, category, expiryDate } = req.body;

  const existing = await prisma.product.findUnique({ where: { sku } });
  if (existing) return res.status(409).json({ message: 'SKU already exists' });

  const product = await prisma.product.create({
    data: {
      name,
      description: description || null,
      price,
      stock: stock ?? 0,
      sku,
      category: category || null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    },
  });

  await logAction({
    userId: req.user.id,
    action: 'CREATE_PRODUCT',
    entity: 'Product',
    entityId: product.id,
    description: `Created product ${name} (SKU: ${sku})`,
  });

  res.status(201).json({ product });
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const id = Number(req.params.id);
  const { name, description, price, stock, sku, category, expiryDate } = req.body;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ message: 'Product not found' });

  if (sku && sku !== existing.sku) {
    const dup = await prisma.product.findUnique({ where: { sku } });
    if (dup) return res.status(409).json({ message: 'SKU already exists' });
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      description: description !== undefined ? (description || null) : existing.description,
      price: price ?? existing.price,
      stock: stock ?? existing.stock,
      sku: sku ?? existing.sku,
      category: category !== undefined ? (category || null) : existing.category,
      expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : existing.expiryDate,
    },
  });

  await logAction({
    userId: req.user.id,
    action: 'UPDATE_PRODUCT',
    entity: 'Product',
    entityId: product.id,
    description: `Updated product ${product.name}`,
  });

  res.json({ product });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ message: 'Product not found' });

  await prisma.product.delete({ where: { id } });

  res.json({ message: 'Product deleted' });
};

exports.softRemove = async (req, res) => {
  const id = Number(req.params.id);
  const { removalReason } = req.body;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ message: 'Product not found' });

  const product = await prisma.product.update({
    where: { id },
    data: {
      stock: 0,
      removalReason: removalReason || null,
      removedAt: new Date(),
    },
  });

  await logAction({
    userId: req.user.id,
    action: 'REMOVE_PRODUCT',
    entity: 'Product',
    entityId: id,
    description: `Removed product ${existing.name} (reason: ${removalReason || 'not specified'})`,
  });

  res.json({ product, message: 'Product removed from inventory' });
};

Object.keys(module.exports).forEach((key) => {
  module.exports[key] = asyncHandler(module.exports[key]);
});

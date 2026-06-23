const { Prisma } = require('@prisma/client');
const prisma = require('../utils/prisma');
const { logAction } = require('../utils/activityLogger');
const asyncHandler = require('../utils/asyncHandler');

exports.create = async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Items array is required and must not be empty' });
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = {};
  for (const p of products) {
    productMap[p.id] = p;
  }

  const errors = [];
  for (const item of items) {
    const product = productMap[item.productId];
    if (!product) {
      errors.push(`Product ${item.productId} not found`);
    } else if (product.stock < item.quantity) {
      errors.push(`Insufficient stock for ${product.name} (SKU: ${product.sku}): requested ${item.quantity}, available ${product.stock}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Sale validation failed', errors });
  }

  const saleItemsData = items.map((item) => {
    const product = productMap[item.productId];
    const unitPrice = product.price;
    const subtotal = unitPrice.mul(item.quantity);
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      subtotal,
      userId: req.user.id,
    };
  });

  const total = saleItemsData.reduce((sum, si) => sum.add(si.subtotal), new Prisma.Decimal(0));

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        total,
        userId: req.user.id,
        items: { create: saleItemsData },
      },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
      },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return created;
  });

  const productNames = sale.items.map((si) => `${si.product.name} x${si.quantity}`).join(', ');

  await logAction({
    userId: req.user.id,
    action: 'SALE_CREATED',
    entity: 'Sale',
    entityId: sale.id,
    description: `Sale #${sale.id} created: ${productNames}`,
  });

  res.status(201).json({ sale });
};

exports.getAll = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
  const skip = (page - 1) * limit;

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, username: true } },
        items: {
          include: { product: { select: { id: true, name: true, sku: true, price: true } } },
        },
      },
    }),
    prisma.sale.count(),
  ]);

  res.json({
    data: sales,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Items array is required and must not be empty' });
  }

  const existing = await prisma.sale.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existing) return res.status(404).json({ message: 'Sale not found' });

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = {};
  for (const p of products) {
    productMap[p.id] = p;
  }

  const errors = [];
  for (const item of items) {
    const product = productMap[item.productId];
    if (!product) {
      errors.push(`Product ${item.productId} not found`);
    } else {
      const oldQty = existing.items.find((ei) => ei.productId === item.productId)?.quantity || 0;
      const stockDelta = oldQty - item.quantity;
      if (stockDelta < 0 && product.stock < Math.abs(stockDelta)) {
        errors.push(`Insufficient stock for ${product.name}: requested ${item.quantity}, available ${product.stock + oldQty}`);
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Sale update validation failed', errors });
  }

  const sale = await prisma.$transaction(async (tx) => {
    await tx.saleItem.deleteMany({ where: { saleId: id } });

    const saleItemsData = items.map((item) => {
      const product = productMap[item.productId];
      const unitPrice = product.price;
      const subtotal = unitPrice.mul(item.quantity);
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal,
        userId: req.user.id,
      };
    });

    const total = saleItemsData.reduce((sum, si) => sum.add(si.subtotal), new Prisma.Decimal(0));

    const updated = await tx.sale.update({
      where: { id },
      data: {
        total,
        items: { create: saleItemsData },
      },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
      },
    });

    // Restore old stock, then apply new stock
    for (const oldItem of existing.items) {
      await tx.product.update({
        where: { id: oldItem.productId },
        data: { stock: { increment: oldItem.quantity } },
      });
    }
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return updated;
  });

  await logAction({
    userId: req.user.id,
    action: 'SALE_UPDATED',
    entity: 'Sale',
    entityId: sale.id,
    description: `Sale #${sale.id} updated`,
  });

  res.json({ sale });
};

exports.undo = async (req, res) => {
  const id = Number(req.params.id);

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!sale) return res.status(404).json({ message: 'Sale not found' });

  await prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    await tx.saleItem.deleteMany({ where: { saleId: id } });
    await tx.sale.delete({ where: { id } });
  });

  await logAction({
    userId: req.user.id,
    action: 'SALE_UNDONE',
    entity: 'Sale',
    entityId: id,
    description: `Sale #${id} undone and stock restored`,
  });

  res.json({ message: 'Sale undone successfully' });
};

exports.getById = async (req, res) => {
  const id = Number(req.params.id);

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true } },
      items: {
        include: { product: { select: { id: true, name: true, sku: true, price: true } } },
      },
    },
  });

  if (!sale) return res.status(404).json({ message: 'Sale not found' });

  res.json({ sale });
};

Object.keys(module.exports).forEach((key) => {
  module.exports[key] = asyncHandler(module.exports[key]);
});

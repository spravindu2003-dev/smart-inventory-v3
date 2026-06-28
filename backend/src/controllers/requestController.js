const prisma = require('../utils/prisma');
const { logAction } = require('../utils/activityLogger');
const asyncHandler = require('../utils/asyncHandler');

exports.create = async (req, res) => {
  const { targetType, targetId, actionType, payload, message } = req.body;

  if (!targetType || !targetId || !actionType || !payload) {
    return res.status(400).json({ message: 'Missing required fields: targetType, targetId, actionType, payload' });
  }

  const request = await prisma.editRequest.create({
    data: {
      businessId: req.user.businessId,
      requestedById: req.user.id,
      targetType,
      targetId,
      actionType,
      payload,
      message: message || null,
    },
    include: {
      requestedBy: { select: { id: true, name: true } },
    },
  });

  await logAction({
    userId: req.user.id,
    businessId: req.user.businessId,
    action: 'REQUEST_CREATED',
    entity: targetType,
    entityId: targetId,
    description: `${req.user.name} requested ${actionType} on ${targetType} #${targetId}`,
  });

  res.status(201).json({ request });
};

exports.getAll = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
  const status = req.query.status || '';

  const where = { businessId: req.user.businessId };

  if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
    where.status = status;
  }

  const [requests, total] = await Promise.all([
    prisma.editRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        requestedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.editRequest.count({ where }),
  ]);

  res.json({
    data: requests,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

exports.getCount = async (req, res) => {
  const count = await prisma.editRequest.count({
    where: { businessId: req.user.businessId, status: 'PENDING' },
  });

  res.json({ count });
};

exports.approve = async (req, res) => {
  const id = Number(req.params.id);

  const request = await prisma.editRequest.findFirst({
    where: { id, businessId: req.user.businessId },
  });

  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.status !== 'PENDING') return res.status(400).json({ message: 'Request is not pending' });

  if (request.targetType === 'product') {
    const product = await prisma.product.findFirst({
      where: { id: request.targetId, businessId: req.user.businessId },
    });
    if (!product) return res.status(404).json({ message: 'Target product not found' });

    const updateData = {};
    const p = request.payload;
    if (p.name !== undefined) updateData.name = p.name;
    if (p.price !== undefined) updateData.price = p.price;
    if (p.stock !== undefined) updateData.stock = p.stock;
    if (p.sku !== undefined) updateData.sku = p.sku;
    if (p.category !== undefined) updateData.category = p.category || null;
    if (p.description !== undefined) updateData.description = p.description || null;
    if (p.expiryDate !== undefined) updateData.expiryDate = p.expiryDate ? new Date(p.expiryDate) : null;

    if (request.actionType === 'DELETE_PRODUCT') {
      await prisma.product.update({
        where: { id: request.targetId },
        data: { isDeleted: true, ...(p.removalReason ? { removalReason: p.removalReason, stock: 0 } : {}) },
      });
    } else if (request.actionType === 'REMOVE_PRODUCT') {
      await prisma.product.update({
        where: { id: request.targetId },
        data: { stock: 0, removalReason: p.removalReason || null, removedAt: new Date() },
      });
    } else if (Object.keys(updateData).length > 0) {
      await prisma.product.update({
        where: { id: request.targetId },
        data: updateData,
      });
    }
  }

  const updated = await prisma.editRequest.update({
    where: { id },
    data: {
      status: 'APPROVED',
      reviewedById: req.user.id,
    },
    include: {
      requestedBy: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  await logAction({
    userId: req.user.id,
    businessId: req.user.businessId,
    action: 'REQUEST_APPROVED',
    entity: request.targetType,
    entityId: request.targetId,
    description: `${req.user.name} approved ${request.actionType} request by ${updated.requestedBy.name}`,
  });

  res.json({ request: updated });
};

exports.reject = async (req, res) => {
  const id = Number(req.params.id);
  const { message } = req.body;

  const request = await prisma.editRequest.findFirst({
    where: { id, businessId: req.user.businessId },
  });

  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.status !== 'PENDING') return res.status(400).json({ message: 'Request is not pending' });

  const updated = await prisma.editRequest.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewedById: req.user.id,
      message: message || null,
    },
    include: {
      requestedBy: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });

  await logAction({
    userId: req.user.id,
    businessId: req.user.businessId,
    action: 'REQUEST_REJECTED',
    entity: request.targetType,
    entityId: request.targetId,
    description: `${req.user.name} rejected ${request.actionType} request by ${updated.requestedBy.name}`,
  });

  res.json({ request: updated });
};

Object.keys(module.exports).forEach((key) => {
  module.exports[key] = asyncHandler(module.exports[key]);
});

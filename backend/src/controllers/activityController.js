const prisma = require('../utils/prisma');
const asyncHandler = require('../utils/asyncHandler');

exports.getAll = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const { action, user, search, startDate, endDate } = req.query;

  const where = {};

  if (action) {
    where.action = action;
  }

  if (user) {
    where.user = { username: { contains: user, mode: 'insensitive' } };
  }

  if (search) {
    where.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { user: { username: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
  }

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, username: true } } },
    }),
    prisma.activityLog.count({ where }),
  ]);

  res.json({
    data: activities,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

exports.summary = async (_req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalActivities, todayActivities, loginToday, salesToday] = await Promise.all([
    prisma.activityLog.count(),
    prisma.activityLog.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.activityLog.count({
      where: {
        createdAt: { gte: todayStart },
        action: { in: ['LOGIN_SUCCESS', 'LOGIN_FAILED'] },
      },
    }),
    prisma.activityLog.count({
      where: {
        createdAt: { gte: todayStart },
        action: 'SALE_CREATED',
      },
    }),
  ]);

  res.json({
    totalActivities,
    todayActivities,
    loginActivitiesToday: loginToday,
    salesActivitiesToday: salesToday,
  });
};

Object.keys(module.exports).forEach((key) => {
  module.exports[key] = asyncHandler(module.exports[key]);
});

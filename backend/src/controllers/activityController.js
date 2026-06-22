const prisma = require('../utils/prisma');

exports.getAll = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, username: true } } },
    }),
    prisma.activityLog.count(),
  ]);

  res.json({
    activities,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

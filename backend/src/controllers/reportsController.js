const prisma = require('../utils/prisma');

exports.salesTrend = async (_req, res) => {
  const sales = await prisma.sale.findMany({
    select: { createdAt: true, total: true },
    orderBy: { createdAt: 'asc' },
  });

  const grouped = {};
  for (const s of sales) {
    const date = s.createdAt.toISOString().slice(0, 10);
    grouped[date] = (grouped[date] || 0) + 1;
  }

  const trend = Object.entries(grouped).map(([date, count]) => ({ date, count }));
  res.json({ trend });
};

exports.revenueTrend = async (_req, res) => {
  const sales = await prisma.sale.findMany({
    select: { createdAt: true, total: true },
    orderBy: { createdAt: 'asc' },
  });

  const grouped = {};
  for (const s of sales) {
    const date = s.createdAt.toISOString().slice(0, 10);
    grouped[date] = (grouped[date] || 0) + Number(s.total);
  }

  const trend = Object.entries(grouped).map(([date, revenue]) => ({ date, revenue }));
  res.json({ trend });
};

exports.topProducts = async (_req, res) => {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, sku: true, saleItems: { select: { quantity: true } } },
  });

  const ranked = products
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      totalSold: p.saleItems.reduce((sum, si) => sum + si.quantity, 0),
    }))
    .filter((p) => p.totalSold > 0)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 10);

  res.json({ products: ranked });
};

exports.stockDistribution = async (_req, res) => {
  const [inStock, lowStock, outOfStock] = await Promise.all([
    prisma.product.count({ where: { stock: { gt: 10 } } }),
    prisma.product.count({ where: { stock: { gte: 1, lte: 10 } } }),
    prisma.product.count({ where: { stock: 0 } }),
  ]);

  res.json({ inStock, lowStock, outOfStock });
};

exports.activityDistribution = async (_req, res) => {
  const grouped = await prisma.activityLog.groupBy({
    by: ['action'],
    _count: { action: true },
    orderBy: { _count: { action: 'desc' } },
  });

  const distribution = grouped.map((g) => ({
    action: g.action,
    count: g._count.action,
  }));

  res.json({ distribution });
};

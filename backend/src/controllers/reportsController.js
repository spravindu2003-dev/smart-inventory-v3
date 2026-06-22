const prisma = require('../utils/prisma');

exports.salesTrend = async (req, res) => {
  const days = parseInt(req.query.days) || undefined;
  const where = days ? { createdAt: { gte: new Date(Date.now() - days * 86400000) } } : {};

  const sales = await prisma.sale.findMany({
    where,
    select: { createdAt: true },
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

exports.revenueTrend = async (req, res) => {
  const days = parseInt(req.query.days) || undefined;
  const where = days ? { createdAt: { gte: new Date(Date.now() - days * 86400000) } } : {};

  const sales = await prisma.sale.findMany({
    where,
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
  const now = new Date();
  const [inStock, lowStock, outOfStock, expired] = await Promise.all([
    prisma.product.count({ where: { stock: { gt: 10 } } }),
    prisma.product.count({ where: { stock: { gte: 1, lte: 10 } } }),
    prisma.product.count({ where: { stock: 0 } }),
    prisma.product.count({ where: { expiryDate: { lt: now } } }),
  ]);

  res.json({ inStock, lowStock, outOfStock, expired });
};

exports.categoryDistribution = async (_req, res) => {
  const grouped = await prisma.product.groupBy({
    by: ['category'],
    _count: { id: true },
    where: { category: { not: null } },
    orderBy: { _count: { id: 'desc' } },
  });

  const distribution = grouped.map((g) => ({
    category: g.category,
    count: g._count.id,
  }));

  const uncategorized = await prisma.product.count({ where: { category: null } });
  if (uncategorized > 0) distribution.push({ category: 'Uncategorized', count: uncategorized });

  res.json({ distribution });
};

exports.quickInsights = async (_req, res) => {
  const now = new Date();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

  const [allProducts, lowStockProducts, expiredCount, salesAgg, recentSales, olderSales] =
    await Promise.all([
      prisma.product.findMany({
        select: { id: true, name: true, saleItems: { select: { quantity: true } } },
      }),
      prisma.product.findMany({
        where: { stock: { gte: 1, lte: 10 } },
        select: { name: true, stock: true },
      }),
      prisma.product.count({ where: { expiryDate: { lt: now } } }),
      prisma.sale.aggregate({ _avg: { total: true }, _count: true }),
      prisma.sale.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { total: true },
      }),
      prisma.sale.findMany({
        where: { createdAt: { lt: sevenDaysAgo } },
        select: { total: true },
      }),
    ]);

  let bestSellingProduct = null;
  for (const p of allProducts) {
    const totalSold = p.saleItems.reduce((s, si) => s + si.quantity, 0);
    if (totalSold > 0 && (!bestSellingProduct || totalSold > bestSellingProduct.totalSold)) {
      bestSellingProduct = { name: p.name, totalSold };
    }
  }

  const avgSaleValue = salesAgg._count > 0 ? Number(salesAgg._avg.total).toFixed(2) : '0.00';

  const recentRevenue = recentSales.reduce((sum, s) => sum + Number(s.total), 0);
  const olderRevenue = olderSales.reduce((sum, s) => sum + Number(s.total), 0);
  const recentAvg = recentSales.length > 0 ? recentRevenue / recentSales.length : 0;
  const olderAvg = olderSales.length > 0 ? olderRevenue / olderSales.length : 0;

  let revenueTrend;
  if (recentSales.length === 0) {
    revenueTrend = 'No sales data available for the last 7 days';
  } else if (olderSales.length === 0) {
    revenueTrend = 'Sales started in the last 7 days';
  } else if (recentAvg > olderAvg * 1.1) {
    revenueTrend = 'Revenue is trending upward compared to historical average';
  } else if (recentAvg < olderAvg * 0.9) {
    revenueTrend = 'Revenue is trending downward compared to historical average';
  } else {
    revenueTrend = 'Revenue is stable compared to historical average';
  }

  res.json({
    bestSellingProduct,
    lowStockAlerts: lowStockProducts.map((p) => ({ name: p.name, stock: p.stock })),
    expiredProductCount: expiredCount,
    averageSaleValue: avgSaleValue,
    revenueTrend,
  });
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

const prisma = require('../utils/prisma');

exports.summary = async (_req, res) => {
  const [
    totalProducts,
    totalStock,
    lowStockProducts,
    deadStockProducts,
    recentActivities,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.aggregate({ _sum: { stock: true } }),
    prisma.product.count({ where: { stock: { lte: 10 } } }),
    prisma.product.count({
      where: { saleItems: { none: {} } },
    }),
    prisma.activityLog.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
  ]);

  res.json({
    totalProducts,
    totalStock: totalStock._sum.stock || 0,
    lowStockProducts,
    deadStockProducts,
    activitiesToday: recentActivities,
  });
};

exports.mostSold = async (_req, res) => {
  const products = await prisma.product.findMany({
    include: {
      saleItems: { select: { quantity: true } },
    },
  });

  const withSales = products
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      totalSold: p.saleItems.reduce((sum, si) => sum + si.quantity, 0),
    }))
    .filter((p) => p.totalSold > 0)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 10);

  res.json({ products: withSales });
};

exports.leastSold = async (_req, res) => {
  const products = await prisma.product.findMany({
    include: {
      saleItems: { select: { quantity: true } },
    },
  });

  const withSales = products
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      totalSold: p.saleItems.reduce((sum, si) => sum + si.quantity, 0),
    }))
    .filter((p) => p.totalSold > 0)
    .sort((a, b) => a.totalSold - b.totalSold)
    .slice(0, 10);

  res.json({ products: withSales });
};

exports.lowStock = async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { stock: { lte: 10 } },
    orderBy: { stock: 'asc' },
  });

  res.json({ products });
};

exports.deadStock = async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { saleItems: { none: {} } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ products });
};

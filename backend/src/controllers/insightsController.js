const prisma = require('../utils/prisma');
const asyncHandler = require('../utils/asyncHandler');

exports.summary = async (_req, res) => {
  const [
    totalProducts,
    totalStock,
    lowStockProducts,
    deadStockProducts,
    recentActivities,
    revenueAgg,
    totalSales,
    unitsSoldAgg,
    topSellingAgg,
    recentSales,
    lowStockItemsCount,
    outOfStockItemsCount,
    expiredProductsCount,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.aggregate({ _sum: { stock: true } }),
    prisma.product.count({ where: { stock: { lte: 10 } } }),
    prisma.product.count({
      where: { saleItems: { none: {} } },
    }),
    prisma.activityLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
    }),
    prisma.sale.aggregate({ _sum: { total: true } }),
    prisma.sale.count(),
    prisma.saleItem.aggregate({ _sum: { quantity: true } }),
    prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.sale.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true } },
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
      },
    }),
    prisma.product.count({ where: { stock: { gte: 1, lte: 10 } } }),
    prisma.product.count({ where: { stock: 0 } }),
    prisma.product.count({
      where: { expiryDate: { lt: new Date() }, NOT: { expiryDate: null } },
    }),
  ]);

  const productIds = topSellingAgg.map((t) => t.productId);
  const products = productIds.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, sku: true },
      })
    : [];

  const topSellingProducts = topSellingAgg.map((t) => {
    const product = products.find((p) => p.id === t.productId);
    return {
      id: t.productId,
      name: product?.name || 'Unknown',
      sku: product?.sku || '',
      totalSold: t._sum.quantity,
    };
  });

  res.json({
    totalProducts,
    totalStock: totalStock._sum.stock || 0,
    lowStockProducts,
    deadStockProducts,
    activitiesToday: recentActivities,
    totalRevenue: revenueAgg._sum.total || 0,
    totalSales,
    totalUnitsSold: unitsSoldAgg._sum.quantity || 0,
    topSellingProducts,
    recentSales,
    lowStockItems: lowStockItemsCount,
    outOfStockItems: outOfStockItemsCount,
    expiredProducts: expiredProductsCount,
  });
};

exports.mostSold = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
  const skip = (page - 1) * limit;

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
    .sort((a, b) => b.totalSold - a.totalSold);

  const total = withSales.length;

  res.json({
    data: withSales.slice(skip, skip + limit),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

exports.leastSold = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
  const skip = (page - 1) * limit;

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
    .sort((a, b) => a.totalSold - b.totalSold);

  const total = withSales.length;

  res.json({
    data: withSales.slice(skip, skip + limit),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

exports.lowStock = async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { stock: { lte: 10 } },
    orderBy: { stock: 'asc' },
  });

  res.json({
    data: products,
    pagination: { page: 1, limit: products.length, total: products.length, totalPages: 1 },
  });
};

exports.deadStock = async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { saleItems: { none: {} } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    data: products,
    pagination: { page: 1, limit: products.length, total: products.length, totalPages: 1 },
  });
};

Object.keys(module.exports).forEach((key) => {
  module.exports[key] = asyncHandler(module.exports[key]);
});

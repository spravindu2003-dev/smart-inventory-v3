const { Router } = require('express');
const ctrl = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/sales-trend', ctrl.salesTrend);
router.get('/revenue-trend', ctrl.revenueTrend);
router.get('/top-products', ctrl.topProducts);
router.get('/stock-distribution', ctrl.stockDistribution);
router.get('/category-distribution', ctrl.categoryDistribution);
router.get('/quick-insights', ctrl.quickInsights);
router.get('/activity-distribution', ctrl.activityDistribution);

module.exports = router;

const { Router } = require('express');
const ctrl = require('../controllers/reportsController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate);
router.use(authorize('owner'));

router.get('/sales-trend', ctrl.salesTrend);
router.get('/revenue-trend', ctrl.revenueTrend);
router.get('/top-products', ctrl.topProducts);
router.get('/stock-distribution', ctrl.stockDistribution);
router.get('/activity-distribution', ctrl.activityDistribution);

module.exports = router;

const { Router } = require('express');
const ctrl = require('../controllers/insightsController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/summary', ctrl.summary);
router.get('/most-sold', authorize('owner', 'manager'), ctrl.mostSold);
router.get('/least-sold', authorize('owner', 'manager'), ctrl.leastSold);
router.get('/low-stock', ctrl.lowStock);
router.get('/dead-stock', authorize('owner', 'manager'), ctrl.deadStock);

module.exports = router;

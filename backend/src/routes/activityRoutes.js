const { Router } = require('express');
const ctrl = require('../controllers/activityController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate);
router.get('/summary', authorize('owner', 'manager'), ctrl.summary);
router.get('/', authorize('owner', 'manager'), ctrl.getAll);

module.exports = router;

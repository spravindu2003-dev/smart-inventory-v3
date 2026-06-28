const { Router } = require('express');
const ctrl = require('../controllers/requestController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.post('/', ctrl.create);

router.get('/', authorize('owner', 'manager'), ctrl.getAll);
router.get('/count', ctrl.getCount);

router.patch('/:id/approve', authorize('owner', 'manager'), ctrl.approve);
router.patch('/:id/reject', authorize('owner', 'manager'), ctrl.reject);

module.exports = router;

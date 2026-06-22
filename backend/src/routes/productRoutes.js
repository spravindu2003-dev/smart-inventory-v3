const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);

router.post(
  '/',
  authorize('owner', 'manager'),
  [
    body('name').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('stock').optional().isInt({ min: 0 }),
    body('sku').trim().notEmpty(),
  ],
  ctrl.create
);

router.put(
  '/:id',
  authorize('owner', 'manager'),
  [
    body('name').optional().trim().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('stock').optional().isInt({ min: 0 }),
    body('sku').optional().trim().notEmpty(),
  ],
  ctrl.update
);

router.delete('/:id', authorize('owner', 'manager'), ctrl.remove);

router.patch(
  '/:id/remove',
  authorize('owner', 'manager'),
  [body('removalReason').isIn(['expired', 'damaged', 'low_demand']).optional()],
  ctrl.softRemove
);

module.exports = router;

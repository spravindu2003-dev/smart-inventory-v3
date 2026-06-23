const { Router } = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/saleController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('items').isArray({ min: 1 }).withMessage('Items array is required with at least one item'),
    body('items.*.productId').isInt({ min: 1 }).withMessage('Each item must have a valid productId'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item must have a quantity of at least 1'),
  ],
  ctrl.create
);

router.get('/', ctrl.getAll);

router.get('/:id', ctrl.getById);

router.put('/:id', ctrl.update);

router.post('/:id/undo', ctrl.undo);

module.exports = router;

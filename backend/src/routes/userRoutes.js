const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.param, reason: e.msg, value: e.value })),
    });
  }
  next();
}

router.get('/me', authenticate, userController.getMe);

router.put(
  '/me',
  authenticate,
  [
    body('email').optional().isEmail().normalizeEmail(),
    validate,
  ],
  userController.updateMe
);

router.use(authenticate, authorize('owner'));

router.get('/', userController.getAll);

router.post(
  '/create',
  [
    body('name').trim().notEmpty().isLength({ min: 2 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['manager', 'cashier']),
    validate,
  ],
  userController.create
);

router.put(
  '/:id',
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['owner', 'manager', 'cashier']),
    validate,
  ],
  userController.update
);

router.patch('/:id/status', userController.toggleStatus);

router.delete('/:id', userController.remove);

module.exports = router;

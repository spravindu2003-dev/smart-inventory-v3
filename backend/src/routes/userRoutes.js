const { Router } = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.get('/me', authenticate, userController.updateMe);

router.put(
  '/me',
  authenticate,
  [
    body('email').optional().isEmail().normalizeEmail(),
  ],
  userController.updateMe
);

router.use(authenticate, authorize('owner'));

router.get('/', userController.getAll);

router.post(
  '/',
  [
    body('username').trim().notEmpty().isLength({ min: 3 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['manager', 'cashier']),
  ],
  userController.create
);

router.put(
  '/:id',
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['owner', 'manager', 'cashier']),
  ],
  userController.update
);

router.patch('/:id/status', userController.toggleStatus);

router.delete('/:id', userController.remove);

module.exports = router;

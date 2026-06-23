const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.post(
  '/register',
  authenticate,
  authorize('owner'),
  [
    body('username').trim().notEmpty().isLength({ min: 3 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  authController.login
);

router.get('/me', authenticate, authController.getMe);

router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  authController.changePassword
);

router.post(
  '/forgot-password',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  authController.forgotPassword
);

router.post(
  '/reset-password/:token',
  [
    body('password').isLength({ min: 6 }),
  ],
  authController.resetPassword
);

module.exports = router;

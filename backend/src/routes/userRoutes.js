const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

function validate(req, res, next) {
  console.log('[VALIDATE] === CHECKING FIELDS ===');
  console.log('[VALIDATE] req.body:', JSON.stringify(req.body));
  console.log('[VALIDATE] username:', JSON.stringify(req.body.username), '(type:', typeof req.body.username, ') empty?', req.body.username === '', 'null/undef?', req.body.username == null);
  console.log('[VALIDATE] email:', JSON.stringify(req.body.email), '(type:', typeof req.body.email, ') empty?', req.body.email === '', 'null/undef?', req.body.email == null);
  console.log('[VALIDATE] password:', JSON.stringify(req.body.password), '(type:', typeof req.body.password, ') empty?', req.body.password === '', 'null/undef?', req.body.password == null);
  const role = req.body.role;
  console.log('[VALIDATE] role (raw):', JSON.stringify(role), '(type:', typeof role, ')');
  console.log('[VALIDATE] role (trimmed):', JSON.stringify(typeof role === 'string' ? role.trim() : role));
  console.log('[VALIDATE] role (lowered):', JSON.stringify(typeof role === 'string' ? role.trim().toLowerCase() : role));
  console.log('[VALIDATE] role in [manager,cashier]?', ['manager', 'cashier'].includes(typeof role === 'string' ? role.trim().toLowerCase() : role));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('[VALIDATE] === FAILED ===');
    errors.array().forEach((err) => {
      console.log(`[VALIDATE]   [VALIDATION FAIL] ${err.param}: ${err.msg} (value: ${JSON.stringify(err.value)})`);
    });
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.param, reason: e.msg, value: e.value })),
    });
  }
  console.log('[VALIDATE] === ALL PASSED ===');
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
  '/',
  [
    body('username').trim().notEmpty().isLength({ min: 3 }),
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

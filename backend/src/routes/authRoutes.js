const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { register, login, me } = require('../controllers/authController');
const { registerRules, loginRules } = require('../validators/authValidators');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/auth');

// max 30 tries per 15 minutes per IP on login and register (stops password guessing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skip: () => process.env.NODE_ENV === 'test', 
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.get('/me', protect, me);

module.exports = router;
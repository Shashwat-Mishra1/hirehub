const router = require('express').Router();
const { register, login, me } = require('../controllers/authController');
const { registerRules, loginRules } = require('../validators/authValidators');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/auth');

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/me', protect, me);

module.exports = router;
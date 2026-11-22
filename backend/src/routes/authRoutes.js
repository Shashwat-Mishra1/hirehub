const router = require('express').Router();
const { register } = require('../controllers/authController');
const { registerRules } = require('../validators/authValidators');
const validate = require('../middlewares/validate');

router.post('/register', registerRules, validate, register);

module.exports = router;
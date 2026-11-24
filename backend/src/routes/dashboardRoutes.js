const router = require('express').Router();
const { getStats } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/auth');

router.get('/stats', protect, getStats);   // any logged-in user; the controller decides what to show

module.exports = router;
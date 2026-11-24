const router = require('express').Router();
const { getJobs, getMyJobs, getJob, createJob, updateJob, deleteJob } = require('../controllers/jobController');
const { jobRules, idRule } = require('../validators/jobValidators');
const validate = require('../middlewares/validate');
const { protect, authorize } = require('../middlewares/auth');

const staff = [protect, authorize('recruiter', 'admin')];

router.get('/', getJobs);                                          // public
router.get('/mine', ...staff, getMyJobs);                          // must come BEFORE '/:id'
router.get('/:id', idRule, validate, getJob);                      // public
router.post('/', ...staff, jobRules(true), validate, createJob);
router.put('/:id', ...staff, idRule, jobRules(false), validate, updateJob);
router.delete('/:id', ...staff, idRule, validate, deleteJob);

module.exports = router;
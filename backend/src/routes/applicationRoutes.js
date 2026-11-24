const router = require('express').Router();
const c = require('../controllers/applicationController');
const { idParam, statusRules } = require('../validators/applicationValidators');
const validate = require('../middlewares/validate');
const { protect, authorize } = require('../middlewares/auth');
const { uploadResume } = require('../middlewares/upload');

const candidate = [protect, authorize('candidate')];
const staff = [protect, authorize('recruiter', 'admin')];

router.post('/jobs/:jobId/apply', ...candidate, uploadResume, idParam('jobId'), validate, c.apply);
router.get('/jobs/:jobId/applications', ...staff, idParam('jobId'), validate, c.getJobApplications);

router.get('/applications/mine', ...candidate, c.getMyApplications);
router.patch('/applications/:id/status', ...staff, idParam('id'), statusRules, validate, c.updateStatus);
router.delete('/applications/:id', ...candidate, idParam('id'), validate, c.withdraw);
router.get('/applications/:id/resume', protect, idParam('id'), validate, c.downloadResume);

module.exports = router;
const path = require('path');
const fs = require('fs');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { parsePagination } = require('../utils/apiFeatures');
const { RESUME_DIR, removeFile } = require('../middlewares/upload');

const { sendError: serverError } = require('../middlewares/error');

const paginate = (page, limit, total) => ({ page, limit, total, pages: Math.ceil(total / limit) || 1 });

// POST /api/v1/jobs/:jobId/apply   (candidate; form-data: resume file + coverLetter text)
exports.apply = async (req, res) => {
  const fail = (code, message) => {
    removeFile(req.file && req.file.filename);          // do not keep the file if we reject
    return res.status(code).json({ success: false, message });
  };
  try {
    if (!req.file) return fail(400, 'Please upload a resume (PDF, DOC or DOCX)');

    const job = await Job.findById(req.params.jobId);
    if (!job) return fail(404, 'Job not found');
    if (job.status !== 'open' || (job.deadline && job.deadline < new Date())) {
      return fail(400, 'This job is no longer accepting applications');
    }

    const application = await Application.create({
      job: job._id,
      candidate: req.user._id,
      resume: req.file.filename,
      coverLetter: req.body.coverLetter,
      history: [{ status: 'applied' }],
    });
    res.status(201).json({ success: true, data: application });
  } catch (err) {
    if (err.code === 11000) return fail(409, 'You have already applied to this job');
    removeFile(req.file && req.file.filename);
    serverError(res, err);
  }
};

// GET /api/v1/applications/mine   (candidate)  ?status=&page=&limit=
exports.getMyApplications = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { candidate: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const [data, total] = await Promise.all([
      Application.find(filter).sort('-createdAt').skip(skip).limit(limit)
        .populate('job', 'title company location type status'),
      Application.countDocuments(filter),
    ]);
    res.json({ success: true, data, pagination: paginate(page, limit, total) });
  } catch (err) { serverError(res, err); }
};

// GET /api/v1/jobs/:jobId/applications   (that job's recruiter, or admin)
exports.getJobApplications = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (req.user.role !== 'admin' && String(job.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'This is not your job' });
    }

    const { page, limit, skip } = parsePagination(req.query);
    const filter = { job: job._id };
    if (req.query.status) filter.status = req.query.status;

    const [data, total] = await Promise.all([
      Application.find(filter).sort('-createdAt').skip(skip).limit(limit).populate('candidate', 'name email'),
      Application.countDocuments(filter),
    ]);
    res.json({ success: true, data, pagination: paginate(page, limit, total) });
  } catch (err) { serverError(res, err); }
};

// PATCH /api/v1/applications/:id/status   (that job's recruiter, or admin)
exports.updateStatus = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('job', 'postedBy');
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    if (req.user.role !== 'admin' && String(application.job.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'This is not your job' });
    }
    if (application.status === 'withdrawn') {
      return res.status(400).json({ success: false, message: 'The candidate withdrew this application' });
    }

    application.status = req.body.status;
    application.history.push({ status: req.body.status, note: req.body.note });
    await application.save();
    res.json({ success: true, data: application });
  } catch (err) { serverError(res, err); }
};

// DELETE /api/v1/applications/:id   (candidate withdraws their own application)
exports.withdraw = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    if (String(application.candidate) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only withdraw your own applications' });
    }
    application.status = 'withdrawn';
    application.history.push({ status: 'withdrawn' });
    await application.save();
    res.json({ success: true, data: application });
  } catch (err) { serverError(res, err); }
};

// GET /api/v1/applications/:id/resume   (the candidate, that job's recruiter, or admin)
exports.downloadResume = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('job', 'postedBy');
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    const me = String(req.user._id);
    const allowed =
      req.user.role === 'admin' ||
      String(application.candidate) === me ||
      String(application.job.postedBy) === me;
    if (!allowed) return res.status(403).json({ success: false, message: 'Not allowed' });

    const file = path.join(RESUME_DIR, path.basename(application.resume));
    if (!fs.existsSync(file)) return res.status(404).json({ success: false, message: 'Resume file is missing' });
    res.download(file);
  } catch (err) { serverError(res, err); }
};
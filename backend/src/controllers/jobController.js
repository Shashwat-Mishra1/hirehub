const Job = require('../models/Job');
const { parsePagination, parseSort, escapeRegex } = require('../utils/apiFeatures');

const EDITABLE = ['title', 'description', 'company', 'location', 'type', 'category',
                  'skills', 'experienceMin', 'salaryMin', 'salaryMax', 'deadline', 'status'];

// copy only the allowed fields from the request body
const pick = (obj, keys) =>
  Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

// admin can manage everything; a recruiter only their own jobs
const canManage = (job, user) =>
  user.role === 'admin' || String(job.postedBy) === String(user._id);

const serverError = (res, err) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Server error' });
};

// GET /api/v1/jobs  (public)
// ?search=&type=&location=&category=&skills=react,node&minSalary=&maxExp=&sort=&page=&limit=
exports.getJobs = async (req, res) => {
  try {
    const q = req.query;
    const { page, limit, skip } = parsePagination(q);

    const filter = { status: 'open' };

    if (q.search) {
      const rx = new RegExp(escapeRegex(q.search), 'i');           // 'i' = ignore upper/lower case
      filter.$or = [{ title: rx }, { company: rx }, { description: rx }, { skills: rx }];
    }
    if (q.type) filter.type = { $in: String(q.type).split(',') };   // type=internship,remote
    if (q.location) filter.location = new RegExp(escapeRegex(q.location), 'i');
    if (q.category) filter.category = new RegExp(`^${escapeRegex(q.category)}$`, 'i');
    if (q.skills) {
      filter.skills = {
        $in: String(q.skills).split(',').map((s) => new RegExp(`^${escapeRegex(s.trim())}$`, 'i')),
      };
    }
    if (q.minSalary) filter.salaryMax = { $gte: Number(q.minSalary) || 0 };
    if (q.maxExp) filter.experienceMin = { $lte: Number(q.maxExp) || 0 };

    const sort = parseSort(q.sort, ['createdAt', 'title', 'salaryMax']);

    // run both queries at the same time
    const [jobs, total] = await Promise.all([
      Job.find(filter).sort(sort).skip(skip).limit(limit).populate('postedBy', 'name company'),
      Job.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: jobs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) { serverError(res, err); }
};

// GET /api/v1/jobs/mine  (recruiter / admin: my own jobs, any status)
exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort('-createdAt');
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) { serverError(res, err); }
};

// GET /api/v1/jobs/:id  (public)
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name company');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: job });
  } catch (err) { serverError(res, err); }
};

// POST /api/v1/jobs
exports.createJob = async (req, res) => {
  try {
    const job = await Job.create({ ...pick(req.body, EDITABLE), postedBy: req.user._id });
    res.status(201).json({ success: true, data: job });
  } catch (err) { serverError(res, err); }
};

// PUT /api/v1/jobs/:id
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (!canManage(job, req.user)) {
      return res.status(403).json({ success: false, message: 'You can only edit your own jobs' });
    }
    job.set(pick(req.body, EDITABLE));
    await job.save();
    res.json({ success: true, data: job });
  } catch (err) { serverError(res, err); }
};

// DELETE /api/v1/jobs/:id
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (!canManage(job, req.user)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own jobs' });
    }
    await job.deleteOne();
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) { serverError(res, err); }
};
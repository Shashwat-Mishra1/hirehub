const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { sendError } = require('../middlewares/error');

// [{ _id: 'applied', count: 3 }]  ->  { applied: 3 }
const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));
const sum = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);

const byStatus = (match) =>
  Application.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]);

// applications per month for the last 6 months: [{ _id: '2026-11', count: 4 }]
const monthlyTrend = (match) => {
  const from = new Date();
  from.setMonth(from.getMonth() - 5);
  from.setDate(1);
  from.setHours(0, 0, 0, 0);
  return Application.aggregate([
    { $match: { ...match, createdAt: { $gte: from } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
};

// GET /api/v1/dashboard/stats
exports.getStats = async (req, res) => {
  try {
    const { role, _id } = req.user;
    let data;

    if (role === 'candidate') {
      const [statuses, trend] = await Promise.all([byStatus({ candidate: _id }), monthlyTrend({ candidate: _id })]);
      const byStatusMap = toMap(statuses);
      data = { totalApplications: sum(byStatusMap), byStatus: byStatusMap, trend };

    } else if (role === 'recruiter') {
      const jobIds = await Job.find({ postedBy: _id }).distinct('_id');   // ids of this recruiter's jobs
      const [jobStatus, statuses, trend, topJobs] = await Promise.all([
        Job.aggregate([{ $match: { postedBy: _id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
        byStatus({ job: { $in: jobIds } }),
        monthlyTrend({ job: { $in: jobIds } }),
        Application.aggregate([
          { $match: { job: { $in: jobIds } } },
          { $group: { _id: '$job', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'job' } },   // join the job's details
          { $unwind: '$job' },
          { $project: { _id: 0, jobId: '$_id', title: '$job.title', applicants: '$count' } },
        ]),
      ]);
      const jobMap = toMap(jobStatus);
      const byStatusMap = toMap(statuses);
      data = {
        totalJobs: sum(jobMap),
        openJobs: jobMap.open || 0,
        closedJobs: jobMap.closed || 0,
        totalApplications: sum(byStatusMap),
        byStatus: byStatusMap,
        trend,
        topJobs,
      };

    } else {
      const [users, jobs, statuses, trend] = await Promise.all([
        User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
        Job.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        byStatus({}),
        monthlyTrend({}),
      ]);
      const userMap = toMap(users);
      const jobMap = toMap(jobs);
      const byStatusMap = toMap(statuses);
      data = {
        totalUsers: sum(userMap),
        usersByRole: userMap,
        totalJobs: sum(jobMap),
        openJobs: jobMap.open || 0,
        totalApplications: sum(byStatusMap),
        byStatus: byStatusMap,
        trend,
      };
    }

    res.json({ success: true, data });
  } catch (err) { sendError(res, err); }
};
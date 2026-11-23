const express = require('express');
const authRoutes = require('./routes/authRoutes');
const { protect, authorize } = require('./middlewares/auth');

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('Job Portal API is running'));
app.use('/api/v1/auth', authRoutes);

// TEMPORARY - we will delete these in Lesson 6
app.get('/api/v1/test/recruiter', protect, authorize('recruiter', 'admin'), (req, res) =>
  res.json({ success: true, message: `Hello ${req.user.role}, you can post jobs` })
);
app.get('/api/v1/test/admin', protect, authorize('admin'), (req, res) =>
  res.json({ success: true, message: 'Hello admin' })
);

module.exports = app;
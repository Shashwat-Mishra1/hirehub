const express = require('express');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('Job Portal API is running'));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/jobs', jobRoutes);

module.exports = app;
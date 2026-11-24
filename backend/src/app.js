const express = require('express');
const applicationRoutes = require('./routes/applicationRoutes');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('Job Portal API is running'));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1', applicationRoutes);


module.exports = app;
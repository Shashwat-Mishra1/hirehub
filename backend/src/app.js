const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const sanitize = require('./middlewares/sanitize');
const { notFound, errorHandler } = require('./middlewares/error');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');

const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

app.set('trust proxy', 1);                                   // needed behind AWS/Nginx for correct IPs

app.use(helmet());                                           // security headers
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev')); // request logging
app.use(express.json({ limit: '10kb' }));                    // reject huge bodies
app.use(sanitize);                                           // NoSQL injection protection

app.use(
  rateLimit({                                                // general limit: 300 requests / 15 min / IP
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later' },
  })
);

app.get('/', (req, res) => res.send('Job Portal API is running'));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1', applicationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.use(notFound);        // must come AFTER all routes
app.use(errorHandler);    // must be the LAST middleware

module.exports = app;
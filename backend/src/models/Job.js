const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true, trim: true },
    company:  { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    type:     { type: String, enum: ['full-time', 'part-time', 'internship'], default: 'full-time' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
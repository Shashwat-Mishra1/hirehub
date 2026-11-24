const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title:         { type: String, required: true, trim: true, maxlength: 120 },
    description:   { type: String, required: true, trim: true, maxlength: 5000 },
    company:       { type: String, required: true, trim: true },
    location:      { type: String, required: true, trim: true },
    type:          { type: String, enum: ['full-time', 'part-time', 'internship', 'contract', 'remote'], default: 'full-time' },
    category:      { type: String, trim: true, default: 'General' },
    skills:        { type: [String], default: [] },
    experienceMin: { type: Number, min: 0, default: 0 },
    salaryMin:     { type: Number, min: 0 },
    salaryMax:     { type: Number, min: 0 },
    deadline:      { type: Date },
    status:        { type: String, enum: ['open', 'closed'], default: 'open' },
    postedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
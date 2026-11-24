const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    job:         { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    candidate:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resume:      { type: String, required: true },          // stored file name
    coverLetter: { type: String, trim: true, maxlength: 3000, default: '' },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'interview', 'offered', 'rejected', 'withdrawn'],
      default: 'applied',
    },
    history: [
      {
        status: String,
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// one candidate can apply to a job only once
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
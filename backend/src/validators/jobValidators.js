const { body, param } = require('express-validator');

exports.idRule = param('id').isMongoId().withMessage('Invalid job id');

// required fields are mandatory when creating, optional when updating
const field = (name, required, msg) =>
  required ? body(name).trim().notEmpty().withMessage(msg)
           : body(name).optional().trim().notEmpty().withMessage(msg);

exports.jobRules = (required) => [
  field('title', required, 'Title is required').isLength({ max: 120 }).withMessage('Title must be at most 120 characters'),
  field('description', required, 'Description is required'),
  field('company', required, 'Company is required'),
  field('location', required, 'Location is required'),
  body('type').optional().isIn(['full-time', 'part-time', 'internship', 'contract', 'remote']).withMessage('Invalid job type'),
  body('category').optional().trim(),
  body('skills').optional().isArray({ max: 30 }).withMessage('Skills must be a list'),
  body('experienceMin').optional().isInt({ min: 0, max: 50 }).withMessage('Experience must be 0 to 50 years'),
  body('salaryMin').optional().isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('salaryMax').optional().isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('deadline').optional().isISO8601().withMessage('Deadline must be a valid date'),
  body('status').optional().isIn(['open', 'closed']).withMessage('Status must be open or closed'),
];
const { body, param } = require('express-validator');

exports.idParam = (name) => param(name).isMongoId().withMessage(`Invalid ${name}`);

exports.statusRules = [
  body('status')
    .isIn(['shortlisted', 'interview', 'offered', 'rejected'])
    .withMessage('Status must be shortlisted, interview, offered or rejected'),
  body('note').optional().trim().isLength({ max: 500 }),
];
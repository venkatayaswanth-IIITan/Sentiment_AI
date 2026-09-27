const { body } = require('express-validator');

const validateSignup = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters.'),
];

const validateSignin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
];

module.exports = {
  validateSignup,
  validateSignin,
};

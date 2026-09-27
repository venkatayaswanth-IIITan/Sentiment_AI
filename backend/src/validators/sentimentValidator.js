const { body, validationResult } = require('express-validator');

const validateSentimentAnalysis = [
  body('content')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Content text is required'),
  body('brandId')
    .optional()
    .isUUID()
    .withMessage('brandId must be a valid UUID'),
  body('source')
    .optional()
    .isString()
    .trim(),
  body('modelType')
    .optional()
    .isIn(['ml', 'cnn', 'bilstm'])
    .withMessage('modelType must be one of: ml, cnn, bilstm'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateSentimentAnalysis,
};

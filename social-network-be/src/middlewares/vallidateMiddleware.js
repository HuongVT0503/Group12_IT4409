import { body } from 'express-validator';

function validateBody(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

const updateProfileValidators = [
  body('display_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Display name must be between 2 and 100 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  
  body('avatar_url')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
    if (value.startsWith('/uploads/') || value.startsWith('http')) {
      return true;
    }
    throw new Error('Avatar URL must be a valid URL or a local path');
  }),
  
  body('cover_url')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
    if (value.startsWith('/uploads/') || value.startsWith('http')) {
      return true;
    }
    throw new Error('Avatar URL must be a valid URL or a local path');
  }),
  
  body('date_of_birth')
    .optional()
    .trim()
    .isISO8601()
    .withMessage('Date of birth must be a valid ISO 8601 date'),
  
  body('gender')
    .optional()
    .trim()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Gender must be one of: male, female, other, prefer_not_to_say'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[+\d\s\-()]*$/)
    .withMessage('Phone number format is invalid')
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters')
];

export { validateBody, updateProfileValidators };

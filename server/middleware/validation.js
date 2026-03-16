/**
 * ContentCraft Validation Middleware
 * Input validation using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

const userValidation = {
    register: [
        body('name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Name must be between 2 and 100 characters'),
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long'),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords do not match');
                }
                return true;
            }),
        handleValidationErrors
    ],
    
    login: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
        handleValidationErrors
    ],
    
    updateProfile: [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Name must be between 2 and 100 characters'),
        body('bio')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Bio must not exceed 500 characters'),
        body('phone')
            .optional()
            .trim()
            .matches(/^[\d\s\-\+\(\)]{7,20}$/)
            .withMessage('Please provide a valid phone number'),
        body('location')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Location must not exceed 100 characters'),
        body('website')
            .optional()
            .trim()
            .isURL()
            .withMessage('Please provide a valid URL'),
        handleValidationErrors
    ],
    
    changePassword: [
        body('currentPassword')
            .notEmpty()
            .withMessage('Current password is required'),
        body('newPassword')
            .isLength({ min: 6 })
            .withMessage('New password must be at least 6 characters long'),
        handleValidationErrors
    ]
};

const blogValidation = {
    create: [
        body('title')
            .trim()
            .isLength({ min: 5, max: 255 })
            .withMessage('Title must be between 5 and 255 characters'),
        body('description')
            .trim()
            .isLength({ min: 10, max: 500 })
            .withMessage('Description must be between 10 and 500 characters'),
        body('content')
            .trim()
            .isLength({ min: 50 })
            .withMessage('Content must be at least 50 characters long'),
        body('category_id')
            .isInt({ min: 1 })
            .withMessage('Please select a valid category'),
        handleValidationErrors
    ],
    
    update: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('Invalid blog ID'),
        body('title')
            .optional()
            .trim()
            .isLength({ min: 5, max: 255 })
            .withMessage('Title must be between 5 and 255 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ min: 10, max: 500 })
            .withMessage('Description must be between 10 and 500 characters'),
        body('content')
            .optional()
            .trim()
            .isLength({ min: 50 })
            .withMessage('Content must be at least 50 characters long'),
        body('category_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Please select a valid category'),
        handleValidationErrors
    ],
    
    getById: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('Invalid blog ID'),
        handleValidationErrors
    ],
    
    list: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage('Limit must be between 1 and 50'),
        query('category')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Category must be a positive integer'),
        query('sort')
            .optional()
            .isIn(['latest', 'oldest', 'popular', 'rated'])
            .withMessage('Sort must be one of: latest, oldest, popular, rated'),
        handleValidationErrors
    ]
};

const commentValidation = {
    create: [
        param('blogId')
            .isInt({ min: 1 })
            .withMessage('Invalid blog ID'),
        body('comment')
            .trim()
            .isLength({ min: 1, max: 1000 })
            .withMessage('Comment must be between 1 and 1000 characters'),
        handleValidationErrors
    ],
    
    delete: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('Invalid comment ID'),
        handleValidationErrors
    ]
};

const ratingValidation = {
    create: [
        param('blogId')
            .isInt({ min: 1 })
            .withMessage('Invalid blog ID'),
        body('rating')
            .isInt({ min: 1, max: 5 })
            .withMessage('Rating must be between 1 and 5'),
        handleValidationErrors
    ]
};

const contactValidation = {
    submit: [
        body('name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Name must be between 2 and 100 characters'),
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),
        body('phone')
            .optional()
            .trim()
            .matches(/^[\d\s\-\+\(\)]{7,20}$/)
            .withMessage('Please provide a valid phone number'),
        body('message')
            .trim()
            .isLength({ min: 10, max: 2000 })
            .withMessage('Message must be between 10 and 2000 characters'),
        handleValidationErrors
    ]
};

const categoryValidation = {
    create: [
        body('name')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Category name must be between 2 and 50 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 255 })
            .withMessage('Description must not exceed 255 characters'),
        handleValidationErrors
    ],
    
    update: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('Invalid category ID'),
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Category name must be between 2 and 50 characters'),
        handleValidationErrors
    ]
};

const searchValidation = [
    query('q')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Search query must be between 2 and 100 characters'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),
    handleValidationErrors
];

module.exports = {
    userValidation,
    blogValidation,
    commentValidation,
    ratingValidation,
    contactValidation,
    categoryValidation,
    searchValidation,
    handleValidationErrors
};
/**
 * Error handler middlewares for the application
 */

/**
 * Handles 403 Forbidden errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} message - Optional custom message
 */
const handle403 = (req, res, message = 'Access denied: You do not have permission to access this resource') => {
    // Log the forbidden access attempt
    console.log(`403 Forbidden: ${req.method} ${req.originalUrl} - ${message}`);

    // Check if this is an API request (wants JSON response)
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(403).json({
            status: 'error',
            code: 403,
            message: message
        });
    }

    // For regular requests, render the 403 page
    return res.status(403).render('403Page', {
        message: message,
        returnUrl: req.headers.referer || '/'
    });
};

module.exports = {
    handle403
};

const jwt = require('jsonwebtoken');
const { getUserRoleFromDB } = require('../services/CRUD_service'); // Assume this function fetches user role from DB

/**
 * Middleware to check if user is logged in and add that info
 * to all views for conditional rendering
 */
const addLoginStatus = async (req, res, next) => {
    // Default to not logged in
    res.locals.isLoggedIn = false;
    res.locals.userRole = null;

    // Check for auth token
    const token = req.cookies?.auth_token;

    if (token) {
        try {
            // Verify the token and extract user information
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            // Set login status and user role
            res.locals.isLoggedIn = true;
            userId = decoded.userId || null;
            // Get user Role in database from userId
            const userRole = await getUserRoleFromDB(userId); // Assume this function fetches the role from the database

            res.locals.userRole = userRole || "user";  // Default to 'user' if not specified
            res.locals.username = decoded.username || 'User';

            // Debug output
            // console.log(`User authenticated: ${res.locals.username}, Role: ${res.locals.userRole}`);

        } catch (error) {
            console.log('Invalid token detected:', error.message);
        }
    }

    next();
};

module.exports = {
    addLoginStatus
};

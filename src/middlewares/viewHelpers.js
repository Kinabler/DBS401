const jwt = require('jsonwebtoken');
const { getUserRoleFromDB, getUserByIdInDB } = require('../services/CRUD_service');

/**
 * Middleware to check if user is logged in and add that info
 * to all views for conditional rendering
 */
const addLoginStatus = async (req, res, next) => {
    // Default to not logged in
    res.locals.isLoggedIn = false;
    res.locals.userRole = null;
    res.locals.avatarUrl = '/uploads/default_profile.webp'; // Default avatar

    // Check for auth token
    const token = req.cookies?.auth_token;

    if (token) {
        try {
            // Verify the token and extract user information
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            // Set login status and user role
            res.locals.isLoggedIn = true;
            userId = decoded.userId || null;

            if (userId) {
                // Get user data from database
                try {
                    const userData = await getUserByIdInDB(userId);
                    if (userData && userData.length > 0) {
                        // Set avatar URL from database if available (column index 9)
                        res.locals.avatarUrl = userData[0][9] || '/uploads/default_profile.webp';
                    }
                } catch (dbError) {
                    console.error('Error fetching user data:', dbError);
                }

                // Get user Role in database from userId
                const userRole = await getUserRoleFromDB(userId);
                res.locals.userRole = userRole || "user";  // Default to 'user' if not specified
            }

            res.locals.username = decoded.username || 'User';
        } catch (error) {
            console.log('Invalid token detected:', error.message);
        }
    }

    next();
};

module.exports = {
    addLoginStatus
};

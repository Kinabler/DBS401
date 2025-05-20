const jwt = require('jsonwebtoken');
require('dotenv').config();
const { getIdOfAdminFromDB } = require('../services/CRUD_service');
const { handle403 } = require('./errorHandlers');

// Secret key for JWT - in production, store this in environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
    let token;

    // Check for token in cookies first (safely)
    if (req.cookies && req.cookies.auth_token) {
        token = req.cookies.auth_token;
    }

    // Check for token in Authorization header as fallback
    const bearerHeader = req.headers['authorization'];
    if (!token && typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        token = bearer[1];
    }

    if (!token) {
        console.log("No token found in cookies or authorization header");
        return res.redirect('/login');
    }

    try {
        // Verify token synchronously to properly handle errors
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        // Special authorization for the user list endpoint
        if (req.path === '/user/list') {
            try {
                const adminId = await getIdOfAdminFromDB(); // Await the Promise
                // console.log("Admin ID:", adminId);
                const isAdmin = decoded.userId === adminId;

                if (!isAdmin) {
                    // Use the 403 handler with a custom message
                    return handle403(req, res, "Access denied: Only administrators can view the user list");
                }
            } catch (adminErr) {
                console.error("Error fetching admin ID:", adminErr);
                return res.status(500).send('Server error while verifying permissions');
            }
        }

        next();
    } catch (err) {
        console.log("Token verification failed:", err.message);
        return res.redirect('/login');
    }
};

module.exports = {
    verifyToken
};

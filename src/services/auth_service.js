const jwt = require('jsonwebtoken');
require('dotenv').config();
const bcrypt = require('bcrypt');
const { createPool } = require('../configs/database');

// Secret key for JWT - in production, store this in environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1h';

// Function to authenticate user with SQL injection protection
const authenticateUser = async (username, password) => {
    let connection;
    try {
        // Create a connection pool
        const pool = await createPool();

        // Get a connection from the pool
        connection = await pool.getConnection();

        // Use parameterized query to prevent SQL injection
        const result = await connection.execute(
            'SELECT * FROM users WHERE username = :username',
            { username }
        );

        console.log(">> Query result:", result.rows);

        // Check if user exists - fix the logic error
        if (!result.rows || result.rows.length === 0) {
            return { success: false, message: 'Invalid username or password' };
        }

        // Extract user data
        const user = {
            id: result.rows[0][0],
            username: result.rows[0][1],
            password: result.rows[0][2],
            role: result.rows[0][6] || 'user'
        };

        // Verify the username matches (additional security check)
        if (user.username !== username) {
            return { success: false, message: 'Invalid username or password' };
        }

        // Password validation
        if (password !== user.password) {
            return { success: false, message: 'Invalid username or password' };
        }

        // Generate JWT token
        const token = generateToken(user);
        return {
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        };
    } catch (err) {
        console.error('Authentication error:', err);
        return { success: false, message: 'Authentication failed' };
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
};

// Generate JWT token
const generateToken = (user) => {
    const payload = {
        userId: user.id,
        username: user.username,
        role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
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

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("Token verification failed:", err.message);
            return res.redirect('/login');
        } else {
            req.user = decoded;
            next();
        }
    });
};

module.exports = {
    authenticateUser,
    generateToken,
    verifyToken
};
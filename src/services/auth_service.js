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
            'SELECT TO_CHAR(USER_ID) as USER_ID, USERNAME, PASSWORD_HASH, EMAIL, ROLE, CREATED_AT, UPDATED_AT FROM users WHERE username = :username',
            { username }
        );
        console.log(">> Checking user Id:", result.rows[0]);
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
            email: result.rows[0][3],
            role: result.rows[0][4] || 'user',
            createAt: result.rows[0][5],
            updateAt: result.rows[0][6]
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
    console.log("Checking user Id:", user.id);
    const payload = {
        userId: String(user.id),
        username: user.username,
        email: user.email,
        createAt: user.createAt,
        updateAt: user.updateAt
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

module.exports = {
    authenticateUser,
    generateToken
};
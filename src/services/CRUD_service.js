const { createPool } = require('../config/database');
const oracle = require('oracledb');

const getUserFromDB = async () => {
    let connection;
    try {
        // Create a connection pool
        const pool = await createPool();

        // Get a connection from the pool
        connection = await pool.getConnection();

        // Execute a query to fetch user data
        const result = await connection.execute('SELECT * FROM user_profiles');

        // Return the result set
        return result;
    } catch (err) {
        console.error('Error fetching users:', err);
    } finally {
        if (connection) {
            try {
                // Release the connection back to the pool
                await connection.close();
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
}

module.exports = {
    getUserFromDB,
};
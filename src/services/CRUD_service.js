const { profile } = require('console');
const { createPool } = require('../configs/database');
const oracle = require('oracledb');

const getUserFromDB = async () => {
    let connection;
    try {
        // Create a connection pool
        const pool = await createPool();

        // Get a connection from the pool
        connection = await pool.getConnection();

        // Select specific columns in the same order they were before
        // This ensures the indices in the template remain valid
        const result = await connection.execute(`
            SELECT 
                up.profile_id,
                up.user_id, 
                up.full_name, 
                up.address, 
                up.phone_number, 
                up.hobbies, 
                up.birthday,
                u.created_at,
                NVL(up.gender, 'Unknown') as gender
            FROM user_profiles up
            JOIN users u ON up.user_id = u.user_id
            ORDER BY up.user_id ASC
        `);

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

const getUserByIdInDB = async (id) => {
    let connection;
    try {
        // Create a connection pool
        const pool = await createPool();

        // Get a connection from the pool
        connection = await pool.getConnection();

        // Debug the incoming ID
        console.log('Fetching user with ID:', id);

        // Execute a query to fetch user data by user_id (not profile_id)
        // Updated to include avatar_url column
        const result = await connection.execute(
            `SELECT 
                up.profile_id,
                up.user_id, 
                up.full_name, 
                up.address, 
                up.phone_number, 
                up.hobbies, 
                up.birthday,
                u.created_at,
                NVL(up.gender, 'Unknown') as gender,
                NVL(up.avatar_url, '/uploads/default_profile.webp') as avatar_url
            FROM user_profiles up 
            JOIN users u ON up.user_id = u.user_id 
            WHERE u.user_id = :id`,
            [id]
        );

        console.log('User lookup result rows:', result.rows ? result.rows.length : 0);

        // Return the result rows
        return result.rows;
    } catch (err) {
        console.error('Error fetching user by ID:', err);
        throw err; // Rethrow the error so we can catch it in the controller
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

const updateUserInDB = async (data) => {
    const { profile_id, full_name, address, phone_number, hobbies, birthday, gender } = data;
    let connection;
    try {
        // Create a connection pool
        const pool = await createPool();

        // Get a connection from the pool
        connection = await pool.getConnection();

        // Log the data being sent to the database for debugging
        console.log('Updating user with data:', {
            user_id: profile_id, // Note: profile_id is actually user_id from the JWT
            full_name,
            address,
            phone_number,
            hobbies,
            birthday,
            gender
        });

        // Update using user_id instead of profile_id
        const result = await connection.execute(
            `UPDATE user_profiles 
            SET full_name = :full_name, 
                address = :address, 
                phone_number = :phone_number, 
                hobbies = :hobbies
                ${birthday ? ', birthday = :birthday' : ''}
                ${gender ? ', gender = :gender' : ''}
            WHERE user_id = :user_id`,  // Changed from profile_id to user_id
            {
                full_name,
                address,
                phone_number,
                hobbies,
                ...(birthday && { birthday }),
                ...(gender && { gender }),
                user_id: profile_id  // Use the JWT user_id as the user_id
            },
            { autoCommit: true }
        );

        console.log('Update result:', result);

        // Return the result
        return result;
    } catch (err) {
        console.error('Error updating user:', err);
        console.error('Error details:', err.message);
        if (err.offset) {
            console.error(`Error at position: ${err.offset}`);
        }
        throw err; // Re-throw to handle it in the controller
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

const getIdOfAdminFromDB = async () => {
    let connection;
    try {
        // Create a connection pool
        const pool = await createPool();

        // Get a connection from the pool
        connection = await pool.getConnection();

        // Execute a query to fetch the admin user ID
        const result = await connection.execute(
            'SELECT TO_CHAR(user_id) as user_id FROM users WHERE role = :role',
            { role: 'admin' }
        );

        // Return the admin user ID
        return result.rows[0][0];
    } catch (err) {
        console.error('Error fetching admin user ID:', err);
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

const getUserRoleFromDB = async (userId) => {
    let connection;
    try {
        // Create a connection pool
        const pool = await createPool();

        // Get a connection from the pool
        connection = await pool.getConnection();

        // Execute a query to fetch the user role
        const result = await connection.execute(
            'SELECT role FROM users WHERE user_id = :userId',
            { userId }
        );

        // Return the user role
        return result.rows[0][0];
    } catch (err) {
        console.error('Error fetching user role:', err);
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
    getUserByIdInDB,
    updateUserInDB,
    getIdOfAdminFromDB,
    getUserRoleFromDB,
};
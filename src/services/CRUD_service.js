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

        // Execute a query to fetch user data - now supporting both profile_id and random_id lookups
        let result;

        // Determine if the id is numeric (profile_id) or string (random_id)
        if (!isNaN(id)) {
            // If numeric, query by profile_id
            result = await connection.execute(
                'SELECT up.*, u.random_id FROM user_profiles up JOIN users u ON up.user_id = u.user_id WHERE up.profile_id = :id',
                [id]
            );
        } else {
            // If string, assume it's a random_id
            result = await connection.execute(
                'SELECT up.*, u.random_id FROM user_profiles up JOIN users u ON up.user_id = u.user_id WHERE up.random_id = :id OR u.random_id = :id',
                [id]
            );
        }

        // Return the result set
        return result.rows;
    } catch (err) {
        console.error('Error fetching user by ID:', err);
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
            profile_id,
            full_name,
            address,
            phone_number,
            hobbies,
            birthday,
            gender
        });

        let result;

        // Support updating by either profile_id or random_id
        if (profile_id) {
            result = await connection.execute(
                `UPDATE user_profiles 
                SET full_name = :full_name, 
                    address = :address, 
                    phone_number = :phone_number, 
                    hobbies = :hobbies, 
                    birthday = :birthday, 
                    gender = :gender
                WHERE profile_id = :profile_id`,
                {
                    full_name,
                    address,
                    phone_number,
                    hobbies,
                    birthday,
                    gender,
                    profile_id
                },
                { autoCommit: true }
            );
        } else if (random_id) {
            result = await connection.execute(
                `UPDATE user_profiles 
                SET full_name = :full_name, 
                    address = :address, 
                    phone_number = :phone_number, 
                    hobbies = :hobbies, 
                    birthday = :birthday, 
                    gender = :gender
                WHERE random_id = :random_id`,
                {
                    full_name,
                    address,
                    phone_number,
                    hobbies,
                    birthday,
                    gender,
                    random_id
                },
                { autoCommit: true }
            );
        } else {
            throw new Error('Either profile_id or random_id is required for update');
        }

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
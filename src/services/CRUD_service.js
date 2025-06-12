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
    const { profile_id, full_name, address, phone_number, hobbies, birthday, gender, avatar_url } = data;
    let connection;
    try {
        const pool = await createPool();
        connection = await pool.getConnection();

        console.log('Updating user with data:', {
            user_id: profile_id,
            full_name,
            address,
            phone_number,
            hobbies,
            birthday,
            gender,
            avatar_url
        });

        // Xây dựng câu truy vấn an toàn với prepared statements
        let query = `UPDATE user_profiles 
            SET full_name = :full_name, 
                address = :address, 
                phone_number = :phone_number, 
                hobbies = :hobbies`;

        // Xây dựng đối tượng bind parameters
        let bindParams = {
            full_name,
            address,
            phone_number,
            hobbies,
            user_id: profile_id
        };

        // Thêm birthday nếu có - sử dụng bind parameter an toàn
        if (birthday) {
            query += `, birthday = :birthday`;
            bindParams.birthday = birthday;
        }

        // ĐÃ SỬA: Sử dụng bind parameter thay vì nối chuỗi trực tiếp
        if (gender) {
            query += `, gender = :gender`;
            bindParams.gender = gender;
        }

        // Thêm avatar_url nếu có - sử dụng bind parameter an toàn
        if (avatar_url) {
            query += ', avatar_url = :avatar_url';
            bindParams.avatar_url = avatar_url;
        }

        query += ' WHERE user_id = :user_id';

        console.log('Executing secure query:', query);
        console.log('Bind parameters:', bindParams);

        // Execute the secure query với prepared statements
        const result = await connection.execute(
            query,
            bindParams,
            { autoCommit: true }
        );

        console.log('Update result:', result);
        return result;
    } catch (err) {
        console.error('Error updating user:', err);
        console.error('Error details:', err.message);
        if (err.offset) {
            console.error(`Error at position: ${err.offset}`);
        }
        throw err;
    } finally {
        if (connection) {
            try {
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

        // Check if result.rows exists and has at least one element
        if (!result || !result.rows || result.rows.length === 0) {
            console.log(`No role found for user ID: ${userId}`);
            return 'user'; // Return a default role or handle as appropriate
        }

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

const getFlagFromDB = async () => {
    let connection;
    try {
        // Create a connection pool
        const pool = await createPool();

        // Get a connection from the pool
        connection = await pool.getConnection();

        // Execute a query to fetch the flag
        const result = await connection.execute(
            'SELECT flag_name FROM flag1 WHERE flag_id = :flag_id',
            { flag_id: 'flag' }
        );

        // Return the flag value if found
        if (result.rows && result.rows.length > 0) {
            return result.rows[0][0];
        }
        return null;
    } catch (err) {
        console.error('Error fetching flag:', err);
        return null;
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
    getFlagFromDB,
};
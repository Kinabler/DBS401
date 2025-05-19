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

const getUserByIdInDB = async (id) => {
    let connection;
    try {
        // Create a connection pool
        const pool = await createPool();

        // Get a connection from the pool
        connection = await pool.getConnection();

        // Execute a query to fetch user data
        const result = await connection.execute('SELECT * FROM user_profiles WHERE profile_id = :id', [id]);

        // Return the result set
        return result.rows;
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

const updateUserInDB = async (data) => {
    const profile_id = data.userId;
    const full_name = data.name;
    const address = data.address;
    const phone_number = data.phone;
    const hobbies = data.hobbies;
    // const avatar_url = data.avatar_url;
    const birthday = data.birthday;
    const gender = data.gender;
    let connection;
    try {
        // Create a connection pool
        const pool = await createPool();

        // Get a connection from the pool
        connection = await pool.getConnection();

        // Execute a query to fetch user data
        const result = await connection.execute(
            `UPDATE user_profiles 
            SET full_name = :full_name, address = :address, phone_number = :phone_number, hobbies = :hobbies, birthday = :birthday
            WHERE profile_id = :profile_id`,
            {
                full_name,
                address,
                phone_number,
                hobbies,
                birthday,
                profile_id
            },
            { autoCommit: true }
        );
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
    getUserByIdInDB,
    updateUserInDB,

};
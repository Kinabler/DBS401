const oracle = require('oracledb');
require('dotenv').config();

async function createPool() {
    try {
        // Set up the Oracle database connection configuration
        const pool = await oracle.createPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING,
            poolMin: 10,
            poolMax: 10,
            poolIncrement: 0,
            poolTimeout: 60,
        });

        console.log('Connection Pool has been created.');
        return pool;
    } catch (err) {
        console.error('Error create connection Pool:', err);
        throw err;
    }
}

module.exports = { createPool };
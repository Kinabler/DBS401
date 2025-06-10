const oracle = require('oracledb');
require('dotenv').config();

async function createPool() {
    try {
        // Set up the Oracle database connection configuration
        const pool = await oracle.createPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING,
            poolMin: 2,                    // Giảm số kết nối tối thiểu
            poolMax: 20,                   // Tăng số kết nối tối đa khi cần
            poolIncrement: 2,              // Tăng từng 2 kết nối khi cần
            poolTimeout: 300,              // Tăng timeout lên 5 phút
            poolPingInterval: 60,          // Ping mỗi 60 giây để kiểm tra kết nối
            enableStatistics: true,       // Enable thống kê để monitor
            queueMax: 100,                 // Giới hạn queue request
            queueTimeout: 30000,           // Timeout cho queue (30 giây)
            sessionCallback: function (connection, requestedTag, callbackFn) {
                // Tối ưu session settings
                connection.execute(
                    `ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD HH24:MI:SS'`,
                    callbackFn
                );
            }
        });

        console.log('Connection Pool has been created.');
        return pool;
    } catch (err) {
        console.error('Error create connection Pool:', err);
        throw err;
    }
}

module.exports = { createPool };
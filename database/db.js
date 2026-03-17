const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

if (process.env.MYSQL_PUBLIC_URL) {
    const url = new URL(process.env.MYSQL_PUBLIC_URL);
    pool = mysql.createPool({
        host: url.hostname,
        port: url.port || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.replace('/', ''),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        acquireTimeout: 60000,
        timeout: 60000,
        multipleStatements: true
    });
} else {
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'contentcraft',
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        acquireTimeout: 60000,
        timeout: 60000,
        multipleStatements: true
    });
}

const testConnection = async () => {
    try {
        const conn = await pool.getConnection();
        await conn.ping();
        conn.release();
        return true;
    } catch (err) {
        console.error('DB connection failed:', err.message);
        return false;
    }
};

module.exports = { pool, testConnection };
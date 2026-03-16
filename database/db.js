/**
 * ContentCraft Database Configuration
 * MySQL Connection Pool with optimized settings for scalability
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
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
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        return false;
    }
};

// Query helper with error handling
const query = async (sql, params) => {
    try {
        const [results] = await pool.query(sql, params || []);
        return results;
    } catch (error) {
        console.error('Database query error:', error.message);
        console.error('   SQL:', sql.substring(0, 200));
        console.error('   Params:', params);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.error('   Table does not exist. Run: npm run init-db');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('   Database does not exist. Run: npm run init-db');
        }
        throw error;
    }
};

// Transaction helper
const transaction = async (callback) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    pool,
    query,
    transaction,
    testConnection
};
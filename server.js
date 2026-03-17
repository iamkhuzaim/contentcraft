/**
 * ContentCraft - Unified Frontend + Backend Server
 */

const express = require('express');
const path = require('path');
require('dotenv').config();

const { pool, testConnection } = require('./database/db');

const app = express();

// ===== Middleware =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static front-end
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

// ===== Health Check =====
app.get('/api/health', async (req, res) => {
    try {
        // Try DB ping, timeout after 3s
        const dbConnected = await Promise.race([
            testConnection(),
            new Promise(resolve => setTimeout(() => resolve(false), 3000))
        ]);

        res.json({
            success: true,
            status: 'OK',
            timestamp: new Date().toISOString(),
            database: { connected: dbConnected },
            version: '1.0.0'
        });
    } catch (err) {
        console.error('Health check failed:', err);
        res.status(500).json({ success: false, status: 'ERROR', message: err.message });
    }
});

// ===== Mount API Routes =====
// Example: keep your routes as before
const authRoutes = require('./server/routes/auth');
const blogRoutes = require('./server/routes/blogs');
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
// ... add other routes similarly

// ===== Serve Frontend Pages =====
const servePage = (page) => (req, res) => {
    res.sendFile(path.join(__dirname, 'public', `${page}.html`));
};

// Example page routes
app.get('/', servePage('index'));
app.get('/blogs', servePage('blogs'));
app.get('/blog/:id', servePage('blog'));
app.get('/categories', servePage('categories'));
app.get('/login', servePage('login'));
app.get('/signup', servePage('signup'));
// ... add other pages as before

// ===== 404 Handler =====
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

// ===== Start Server =====
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    const dbConnected = await Promise.race([
        testConnection(),
        new Promise(resolve => setTimeout(() => resolve(false), 3000))
    ]);

    if (!dbConnected) {
        console.warn('Warning: Database not connected! API may not work.');
    }

    app.listen(PORT, () => {
        console.log(`===============================================`);
        console.log(`     ContentCraft Server Started`);
        console.log(`     Server URL: http://localhost:${PORT}`);
        console.log(`     API Health: http://localhost:${PORT}/api/health`);
        console.log(`     Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
        console.log(`===============================================`);
    });
};

startServer();

module.exports = app;
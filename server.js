/**
 * ContentCraft - Main Server File
 * Express.js server with all API routes and middleware
 */

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection, pool } = require('./database/db');

// Import routes
const authRoutes = require('./server/routes/auth');
const blogRoutes = require('./server/routes/blogs');
const commentRoutes = require('./server/routes/comments');
const ratingRoutes = require('./server/routes/ratings');
const categoryRoutes = require('./server/routes/categories');
const messageRoutes = require('./server/routes/messages');
const adminRoutes = require('./server/routes/admin');
const searchRoutes = require('./server/routes/search');
const userRoutes = require('./server/routes/users');
const settingsRoutes = require('./server/routes/settings');
const newsletterRoutes = require('./server/routes/newsletter');
const faqRoutes = require('./server/routes/faq');
const sitemapRoutes = require('./server/routes/sitemap');


// Initialize Express app
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "data:"],
            imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
            connectSrc: ["'self'", "http://localhost:3001", "http://localhost:3000"],
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
    }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/faq', faqRoutes);
app.use('/', sitemapRoutes); // For sitemap.xml and feed.xml

// Health check endpoint
app.get('/api/health', async (req, res) => {
    const dbConnected = await testConnection();
    
    let dbStatus = {
        connected: dbConnected,
        tables: {}
    };
    
    if (dbConnected) {
        try {
            const dbName = process.env.DB_NAME || 'contentcraft';
            const [tables] = await pool.query(`
                SELECT TABLE_NAME 
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('users', 'blogs', 'categories')
            `, [dbName]);
            
            dbStatus.tables.users = tables.some(t => t.TABLE_NAME === 'users');
            dbStatus.tables.blogs = tables.some(t => t.TABLE_NAME === 'blogs');
            dbStatus.tables.categories = tables.some(t => t.TABLE_NAME === 'categories');
            
            if (dbStatus.tables.users) {
                const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
                dbStatus.userCount = userCount[0].count;
            }
        } catch (err) {
            console.error('Health check query error:', err);
        }
    }
    
    res.json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        version: '1.0.0'
    });
});

// Serve HTML pages
const servePage = (page) => (req, res) => {
    res.sendFile(path.join(__dirname, 'public', `${page}.html`));
};

// Page routes
app.get('/', servePage('index'));
app.get('/blogs', servePage('blogs'));
app.get('/blog/:id', servePage('blog'));
app.get('/categories', servePage('categories'));
app.get('/search', servePage('search'));
app.get('/login', servePage('login'));
app.get('/signup', servePage('signup'));
app.get('/dashboard', servePage('dashboard'));
app.get('/profile', servePage('profile'));
app.get('/admin', servePage('admin'));
app.get('/admin/blogs', servePage('admin_blog_manager'));
app.get('/admin/users', servePage('admin_user_manager'));
app.get('/admin/messages', servePage('admin_message_manager'));
app.get('/admin/settings', servePage('admin_settings'));
app.get('/contact', servePage('contact'));
app.get('/about', servePage('about'));
app.get('/privacy', servePage('privacy'));
app.get('/terms', servePage('terms'));
app.get('/faq', servePage('faq'));
app.get('/sitemap', servePage('sitemap'));

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 5MB.'
        });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            success: false,
            message: 'Unexpected field name for file upload.'
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
const startServer = async () => {
    try {
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('Failed to connect to database. Please check your configuration.');
            console.log('\nTo set up the database:');
            console.log('   1. Ensure MySQL is running');
            console.log('   2. Update .env file with your database credentials');
            console.log('   3. Run: npm run init-db');
            console.log('   4. Start the server again: npm start\n');
        }

        app.listen(PORT, () => {
            console.log(`
===============================================
          ContentCraft Server Started
===============================================
  Server URL: http://localhost:${PORT}
  API Health: http://localhost:${PORT}/api/health
  Database:   ${dbConnected ? 'Connected' : 'Disconnected'}
===============================================
  Default Credentials:
     Admin:  admin@contentcraft.com / admin123
     Demo:   demo@contentcraft.com / demo123
===============================================
            `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});

startServer();

module.exports = app;




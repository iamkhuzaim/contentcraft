/**
 * ContentCraft Authentication Middleware
 * JWT-based authentication and role-based access control
 */

const jwt = require('jsonwebtoken');
const { query } = require('../../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role 
        },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. No token provided.' 
            });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        const users = await query('SELECT id, name, email, role, avatar, bio, phone, location, website FROM users WHERE id = ?', [decoded.id]);
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found.' 
            });
        }

        req.user = users[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired. Please login again.' 
            });
        }
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid token.' 
        });
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);
            const users = await query('SELECT id, name, email, role, avatar FROM users WHERE id = ?', [decoded.id]);
            
            if (users.length > 0) {
                req.user = users[0];
            }
        }
        
        next();
    } catch (error) {
        next();
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication required.' 
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Admin access required.' 
        });
    }

    next();
};

module.exports = {
    generateToken,
    verifyToken,
    authenticate,
    optionalAuth,
    requireAdmin
};
/**
 * ContentCraft Newsletter Routes
 * Handle newsletter subscriptions
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        const existing = await query(
            'SELECT id FROM newsletter_subscribers WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This email is already subscribed to our newsletter.'
            });
        }

        await query(
            'INSERT INTO newsletter_subscribers (email, subscribed_at) VALUES (?, NOW())',
            [email]
        );

        res.json({
            success: true,
            message: 'Successfully subscribed to newsletter!'
        });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to subscribe. Please try again.'
        });
    }
});

// Unsubscribe from newsletter
router.post('/unsubscribe', async (req, res) => {
    try {
        const { email } = req.body;

        await query(
            'DELETE FROM newsletter_subscribers WHERE email = ?',
            [email]
        );

        res.json({
            success: true,
            message: 'Successfully unsubscribed from newsletter.'
        });
    } catch (error) {
        console.error('Newsletter unsubscribe error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unsubscribe. Please try again.'
        });
    }
});

// Get all subscribers (Admin only)
router.get('/subscribers', authenticate, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [countResult] = await query('SELECT COUNT(*) as total FROM newsletter_subscribers');
        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);

        const subscribers = await query(
            `SELECT id, email, is_active, subscribed_at 
             FROM newsletter_subscribers 
             ORDER BY subscribed_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        res.json({
            success: true,
            data: {
                subscribers,
                pagination: {
                    current_page: page,
                    total_pages: totalPages,
                    total_items: total,
                    items_per_page: limit
                }
            }
        });
    } catch (error) {
        console.error('Get subscribers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscribers.'
        });
    }
});

module.exports = router;
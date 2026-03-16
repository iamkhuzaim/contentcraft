/**
 * ContentCraft Comments Routes
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');
const { authenticate } = require('../middleware/auth');

// Get all comments (for admin)
router.get('/', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required.'
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [countResult] = await query('SELECT COUNT(*) as total FROM comments');
        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);

        const comments = await query(
            `SELECT c.*, u.name as user_name, b.title as blog_title
             FROM comments c
             LEFT JOIN users u ON c.user_id = u.id
             LEFT JOIN blogs b ON c.blog_id = b.id
             ORDER BY c.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        res.json({
            success: true,
            data: {
                comments,
                pagination: {
                    current_page: page,
                    total_pages: totalPages,
                    total_items: total,
                    items_per_page: limit
                }
            }
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch comments.'
        });
    }
});

module.exports = router;
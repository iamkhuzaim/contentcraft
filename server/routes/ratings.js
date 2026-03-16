/**
 * ContentCraft Ratings Routes
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');
const { authenticate } = require('../middleware/auth');

// Get user's rating for a blog
router.get('/blog/:id', authenticate, async (req, res) => {
    try {
        const blogId = req.params.id;
        const userId = req.user.id;

        const ratings = await query(
            'SELECT rating FROM ratings WHERE blog_id = ? AND user_id = ?',
            [blogId, userId]
        );

        res.json({
            success: true,
            data: {
                rating: ratings.length > 0 ? ratings[0].rating : null
            }
        });
    } catch (error) {
        console.error('Get user rating error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rating.'
        });
    }
});

module.exports = router;
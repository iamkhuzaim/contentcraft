/**
 * ContentCraft Search Routes
 * Full-text search for blogs
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');
const { getFileUrl } = require('../middleware/upload');

// Search blogs
router.get('/', async (req, res) => {
    try {
        const searchQuery = req.query.q;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        if (!searchQuery || searchQuery.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters long.'
            });
        }

        const searchTerm = `%${searchQuery.trim()}%`;

        const countResult = await query(
            `SELECT COUNT(*) as total FROM blogs 
             WHERE is_published = TRUE 
             AND (title LIKE ? OR description LIKE ? OR content LIKE ?)`,
            [searchTerm, searchTerm, searchTerm]
        );
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        const blogs = await query(
            `SELECT 
                b.id, b.title, b.description, b.image, b.views, b.created_at,
                u.name as author_name,
                c.name as category_name,
                AVG(r.rating) as avg_rating,
                COUNT(DISTINCT com.id) as comment_count
             FROM blogs b
             LEFT JOIN users u ON b.author_id = u.id
             LEFT JOIN categories c ON b.category_id = c.id
             LEFT JOIN ratings r ON b.id = r.blog_id
             LEFT JOIN comments com ON b.id = com.blog_id
             WHERE b.is_published = TRUE 
             AND (b.title LIKE ? OR b.description LIKE ? OR b.content LIKE ?)
             GROUP BY b.id
             ORDER BY 
                CASE 
                    WHEN b.title LIKE ? THEN 1
                    WHEN b.description LIKE ? THEN 2
                    ELSE 3
                END,
                b.views DESC
             LIMIT ? OFFSET ?`,
            [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit, offset]
        );

        const formattedBlogs = blogs.map(blog => ({
            ...blog,
            image_url: getFileUrl(blog.image, 'blogs'),
            avg_rating: blog.avg_rating ? parseFloat(blog.avg_rating).toFixed(1) : null
        }));

        res.json({
            success: true,
            data: {
                blogs: formattedBlogs,
                query: searchQuery.trim(),
                pagination: {
                    current_page: page,
                    total_pages: totalPages,
                    total_items: total,
                    items_per_page: limit,
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed. Please try again.'
        });
    }
});

module.exports = router;
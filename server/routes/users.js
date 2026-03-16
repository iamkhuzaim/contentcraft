// /**
//  * ContentCraft User Routes
//  * User profile management and public user data
//  */

// const express = require('express');
// const router = express.Router();
// const { query } = require('../../database/db');
// const { authenticate } = require('../middleware/auth');
// const { getFileUrl } = require('../middleware/upload');

// // Get public user profile by ID
// router.get('/:id', async (req, res) => {
//     try {
//         const userId = req.params.id;

//         const users = await query(
//             `SELECT u.id, u.name, u.avatar, u.bio, u.location, u.website, u.created_at,
//                     COUNT(DISTINCT b.id) as blog_count,
//                     COUNT(DISTINCT c.id) as comment_count
//              FROM users u
//              LEFT JOIN blogs b ON u.id = b.author_id AND b.is_published = TRUE
//              LEFT JOIN comments c ON u.id = c.user_id
//              WHERE u.id = ?
//              GROUP BY u.id`,
//             [userId]
//         );

//         if (users.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found.'
//             });
//         }

//         const user = users[0];

//         res.json({
//             success: true,
//             data: {
//                 user: {
//                     id: user.id,
//                     name: user.name,
//                     avatar_url: getFileUrl(user.avatar, 'avatars'),
//                     bio: user.bio,
//                     location: user.location,
//                     website: user.website,
//                     created_at: user.created_at,
//                     stats: {
//                         blog_count: user.blog_count,
//                         comment_count: user.comment_count
//                     }
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('Get user profile error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to fetch user profile.'
//         });
//     }
// });

// // Get user's blogs
// router.get('/:id/blogs', async (req, res) => {
//     try {
//         const userId = req.params.id;
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const offset = (page - 1) * limit;

//         const [countResult] = await query(
//             'SELECT COUNT(*) as total FROM blogs WHERE author_id = ? AND is_published = TRUE',
//             [userId]
//         );
//         const total = countResult.total;
//         const totalPages = Math.ceil(total / limit);

//         const blogs = await query(
//             `SELECT b.id, b.title, b.description, b.image, b.views, b.created_at,
//                     c.name as category_name,
//                     AVG(r.rating) as avg_rating,
//                     COUNT(DISTINCT com.id) as comment_count
//              FROM blogs b
//              LEFT JOIN categories c ON b.category_id = c.id
//              LEFT JOIN ratings r ON b.id = r.blog_id
//              LEFT JOIN comments com ON b.id = com.blog_id
//              WHERE b.author_id = ? AND b.is_published = TRUE
//              GROUP BY b.id
//              ORDER BY b.created_at DESC
//              LIMIT ? OFFSET ?`,
//             [userId, limit, offset]
//         );

//         const formattedBlogs = blogs.map(blog => ({
//             ...blog,
//             image_url: getFileUrl(blog.image, 'blogs'),
//             avg_rating: blog.avg_rating ? parseFloat(blog.avg_rating).toFixed(1) : null
//         }));

//         res.json({
//             success: true,
//             data: {
//                 blogs: formattedBlogs,
//                 pagination: {
//                     current_page: page,
//                     total_pages: totalPages,
//                     total_items: total,
//                     items_per_page: limit
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('Get user blogs error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to fetch user blogs.'
//         });
//     }
// });

// // Get current user's dashboard stats
// router.get('/me/stats', authenticate, async (req, res) => {
//     try {
//         const userId = req.user.id;

//         const [blogCount] = await query(
//             'SELECT COUNT(*) as count FROM blogs WHERE author_id = ?',
//             [userId]
//         );

//         const [commentCount] = await query(
//             'SELECT COUNT(*) as count FROM comments WHERE user_id = ?',
//             [userId]
//         );

//         const [totalViews] = await query(
//             'SELECT COALESCE(SUM(views), 0) as total FROM blogs WHERE author_id = ?',
//             [userId]
//         );

//         const recentBlogs = await query(
//             `SELECT b.id, b.title, b.views, b.created_at, b.is_published
//              FROM blogs b
//              WHERE b.author_id = ?
//              ORDER BY b.created_at DESC
//              LIMIT 5`,
//             [userId]
//         );

//         res.json({
//             success: true,
//             data: {
//                 stats: {
//                     total_blogs: blogCount[0].count,
//                     total_comments: commentCount[0].count,
//                     total_views: totalViews.total
//                 },
//                 recent_blogs: recentBlogs
//             }
//         });
//     } catch (error) {
//         console.error('Get user stats error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to fetch user stats.'
//         });
//     }
// });

// module.exports = router;





























/**
 * ContentCraft User Routes
 * User profile management and public user data
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');
const { authenticate } = require('../middleware/auth');
const { getFileUrl } = require('../middleware/upload');


// Get public user profile by ID
router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        const users = await query(
            `SELECT u.id, u.name, u.avatar, u.bio, u.location, u.website, u.created_at,
                    COUNT(DISTINCT b.id) as blog_count,
                    COUNT(DISTINCT c.id) as comment_count
             FROM users u
             LEFT JOIN blogs b ON u.id = b.author_id AND b.is_published = TRUE
             LEFT JOIN comments c ON u.id = c.user_id
             WHERE u.id = ?
             GROUP BY u.id`,
            [userId]
        );

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const user = users[0];

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    avatar_url: getFileUrl(user.avatar, 'avatars'),
                    bio: user.bio,
                    location: user.location,
                    website: user.website,
                    created_at: user.created_at,
                    stats: {
                        blog_count: user.blog_count || 0,
                        comment_count: user.comment_count || 0
                    }
                }
            }
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile.'
        });
    }
});


// Get user's blogs
router.get('/:id/blogs', async (req, res) => {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [countResult] = await query(
            'SELECT COUNT(*) as total FROM blogs WHERE author_id = ? AND is_published = TRUE',
            [userId]
        );

        const total = countResult?.total || 0;
        const totalPages = Math.ceil(total / limit);

        const blogs = await query(
            `SELECT b.id, b.title, b.description, b.image, b.views, b.created_at,
                    c.name as category_name,
                    AVG(r.rating) as avg_rating,
                    COUNT(DISTINCT com.id) as comment_count
             FROM blogs b
             LEFT JOIN categories c ON b.category_id = c.id
             LEFT JOIN ratings r ON b.id = r.blog_id
             LEFT JOIN comments com ON b.id = com.blog_id
             WHERE b.author_id = ? AND b.is_published = TRUE
             GROUP BY b.id
             ORDER BY b.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
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
                pagination: {
                    current_page: page,
                    total_pages: totalPages,
                    total_items: total,
                    items_per_page: limit
                }
            }
        });

    } catch (error) {
        console.error('Get user blogs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user blogs.'
        });
    }
});


// Get current user's dashboard stats
router.get('/me/stats', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        const [blogCount] = await query(
            'SELECT COUNT(*) as count FROM blogs WHERE author_id = ?',
            [userId]
        );

        const [commentCount] = await query(
            'SELECT COUNT(*) as count FROM comments WHERE user_id = ?',
            [userId]
        );

        const [totalViews] = await query(
            'SELECT COALESCE(SUM(views),0) as total FROM blogs WHERE author_id = ?',
            [userId]
        );

        const recentBlogs = await query(
            `SELECT b.id, b.title, b.views, b.created_at, b.is_published
             FROM blogs b
             WHERE b.author_id = ?
             ORDER BY b.created_at DESC
             LIMIT 5`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                stats: {
                    total_blogs: blogCount?.count || 0,
                    total_comments: commentCount?.count || 0,
                    total_views: totalViews?.total || 0
                },
                recent_blogs: recentBlogs
            }
        });

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user stats.'
        });
    }
});

module.exports = router;
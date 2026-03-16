// // /**
// //  * ContentCraft Admin Routes
// //  * Admin dashboard and management operations
// //  */

// // const express = require('express');
// // const router = express.Router();
// // const { query } = require('../../database/db');
// // const { authenticate } = require('../middleware/auth');
// // const { getFileUrl } = require('../middleware/upload');

// // function requireAdmin(req, res, next) {
// //     if (!req.user) {
// //         return res.status(401).json({
// //             success: false,
// //             message: 'Authentication required.'
// //         });
// //     }
    
// //     if (req.user.role !== 'admin') {
// //         return res.status(403).json({
// //             success: false,
// //             message: 'Admin access required.',
// //             currentRole: req.user.role
// //         });
// //     }
// //     next();
// // }

// // // Get dashboard statistics
// // router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
// //     try {
// //         const [userCount] = await query('SELECT COUNT(*) as count FROM users');
// //         const [blogCount] = await query('SELECT COUNT(*) as count FROM blogs');
// //         const [commentCount] = await query('SELECT COUNT(*) as count FROM comments');
// //         const [messageCount] = await query('SELECT COUNT(*) as count FROM messages WHERE is_read = FALSE');
// //         const [categoryCount] = await query('SELECT COUNT(*) as count FROM categories');

// //         const recentUsers = await query(
// //             `SELECT id, name, email, role, created_at 
// //              FROM users 
// //              ORDER BY created_at DESC 
// //              LIMIT 5`
// //         );

// //         const recentBlogs = await query(
// //             `SELECT b.id, b.title, b.views, b.created_at, u.name as author_name
// //              FROM blogs b
// //              LEFT JOIN users u ON b.author_id = u.id
// //              ORDER BY b.created_at DESC
// //              LIMIT 5`
// //         );

// //         const popularBlogs = await query(
// //             `SELECT b.id, b.title, b.views, u.name as author_name
// //              FROM blogs b
// //              LEFT JOIN users u ON b.author_id = u.id
// //              ORDER BY b.views DESC
// //              LIMIT 5`
// //         );

// //         res.json({
// //             success: true,
// //             data: {
// //                 stats: {
// //                     total_users: userCount[0].count,
                
// //                     total_blogs: blogCount[0].count,
// //                     total_comments: commentCount[0].count,
// //                     unread_messages: messageCount[0].count,
// //                     total_categories: categoryCount[0].count
// //                 },
// //                 recent_users: recentUsers,
// //                 recent_blogs: recentBlogs,
// //                 popular_blogs: popularBlogs
// //             }
// //         });
// //     } catch (error) {
// //         console.error('Get dashboard error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Failed to fetch dashboard data.',
// //             error: error.message
// //         });
// //     }
// // });

// // // Get all users (with pagination)
// // router.get('/users', authenticate, requireAdmin, async (req, res) => {
// //     try {
// //         const page = parseInt(req.query.page) || 1;
// //         const limit = parseInt(req.query.limit) || 20;
// //         const offset = (page - 1) * limit;
// //         const search = req.query.search;

// //         let whereClause = '';
// //         const params = [];

// //         if (search) {
// //             whereClause = 'WHERE name LIKE ? OR email LIKE ?';
// //             const searchTerm = `%${search}%`;
// //             params.push(searchTerm, searchTerm);
// //         }

// //         const countResult = await query(
// //             `SELECT COUNT(*) as total FROM users ${whereClause}`,
// //             params
// //         );
// //         const total = countResult[0].total;
// //         const totalPages = Math.ceil(total / limit);

// //         const users = await query(
// //             `SELECT u.id, u.name, u.email, u.role, u.avatar, u.created_at,
// //                     COUNT(DISTINCT b.id) as blog_count,
// //                     COUNT(DISTINCT c.id) as comment_count
// //              FROM users u
// //              LEFT JOIN blogs b ON u.id = b.author_id
// //              LEFT JOIN comments c ON u.id = c.user_id
// //              ${whereClause}
// //              GROUP BY u.id
// //              ORDER BY u.created_at DESC
// //              LIMIT ? OFFSET ?`,
// //             [...params, limit, offset]
// //         );

// //         const formattedUsers = users.map(user => ({
// //             ...user,
// //             avatar_url: getFileUrl(user.avatar, 'avatars')
// //         }));

// //         res.json({
// //             success: true,
// //             data: {
// //                 users: formattedUsers,
// //                 pagination: {
// //                     current_page: page,
// //                     total_pages: totalPages,
// //                     total_items: total,
// //                     items_per_page: limit,
// //                     has_next: page < totalPages,
// //                     has_prev: page > 1
// //                 }
// //             }
// //         });
// //     } catch (error) {
// //         console.error('Get users error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Failed to fetch users.',
// //             error: error.message
// //         });
// //     }
// // });

// // // Update user role
// // router.patch('/users/:id/role', authenticate, requireAdmin, async (req, res) => {
// //     try {
// //         const userId = req.params.id;
// //         const { role } = req.body;

// //         if (!['user', 'admin'].includes(role)) {
// //             return res.status(400).json({
// //                 success: false,
// //                 message: 'Invalid role. Must be "user" or "admin".'
// //             });
// //         }

// //         if (parseInt(userId) === req.user.id && role === 'user') {
// //             return res.status(400).json({
// //                 success: false,
// //                 message: 'You cannot change your own role.'
// //             });
// //         }

// //         const result = await query(
// //             'UPDATE users SET role = ? WHERE id = ?',
// //             [role, userId]
// //         );

// //         if (result.affectedRows === 0) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: 'User not found.'
// //             });
// //         }

// //         res.json({
// //             success: true,
// //             message: `User role updated to ${role}.`
// //         });
// //     } catch (error) {
// //         console.error('Update user role error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Failed to update user role.',
// //             error: error.message
// //         });
// //     }
// // });

// // // Delete user
// // router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
// //     try {
// //         const userId = req.params.id;

// //         if (parseInt(userId) === req.user.id) {
// //             return res.status(400).json({
// //                 success: false,
// //                 message: 'You cannot delete your own account.'
// //             });
// //         }

// //         await query('DELETE FROM comments WHERE user_id = ?', [userId]);
// //         await query('DELETE FROM ratings WHERE user_id = ?', [userId]);
// //         await query('DELETE FROM blogs WHERE author_id = ?', [userId]);

// //         const result = await query('DELETE FROM users WHERE id = ?', [userId]);

// //         if (result.affectedRows === 0) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: 'User not found.'
// //             });
// //         }

// //         res.json({
// //             success: true,
// //             message: 'User deleted successfully!'
// //         });
// //     } catch (error) {
// //         console.error('Delete user error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Failed to delete user.',
// //             error: error.message
// //         });
// //     }
// // });

// // // Get all blogs (admin view - includes unpublished)
// // router.get('/blogs', authenticate, requireAdmin, async (req, res) => {
// //     try {
// //         const page = parseInt(req.query.page) || 1;
// //         const limit = parseInt(req.query.limit) || 20;
// //         const offset = (page - 1) * limit;

// //         const [countResult] = await query('SELECT COUNT(*) as total FROM blogs');
// //         const total = countResult[0].total;
// //         total: result[0].total

// //         const totalPages = Math.ceil(total / limit);

// //         const blogs = await query(
// //             `SELECT b.*, u.name as author_name, c.name as category_name,
// //                     COUNT(DISTINCT com.id) as comment_count,
// //                     AVG(r.rating) as avg_rating
// //              FROM blogs b
// //              LEFT JOIN users u ON b.author_id = u.id
// //              LEFT JOIN categories c ON b.category_id = c.id
// //              LEFT JOIN comments com ON b.id = com.blog_id
// //              LEFT JOIN ratings r ON b.id = r.blog_id
// //              GROUP BY b.id
// //              ORDER BY b.created_at DESC
// //              LIMIT ? OFFSET ?`,
// //             [limit, offset]
// //         );

// //         const formattedBlogs = blogs.map(blog => ({
// //             ...blog,
// //             image_url: getFileUrl(blog.image, 'blogs'),
// //             avg_rating: blog.avg_rating ? parseFloat(blog.avg_rating).toFixed(1) : null
// //         }));

// //         res.json({
// //             success: true,
// //             data: {
// //                 blogs: formattedBlogs,
// //                 pagination: {
// //                     current_page: page,
// //                     total_pages: totalPages,
// //                     total_items: total,
// //                     items_per_page: limit,
// //                     has_next: page < totalPages,
// //                     has_prev: page > 1
// //                 }
// //             }
// //         });
// //     } catch (error) {
// //         console.error('Get admin blogs error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Failed to fetch blogs.',
// //             error: error.message
// //         });
// //     }
// // });

// // // Toggle blog publish status
// // router.patch('/blogs/:id/publish', authenticate, requireAdmin, async (req, res) => {
// //     try {
// //         const blogId = req.params.id;
// //         const { is_published } = req.body;

// //         const result = await query(
// //             'UPDATE blogs SET is_published = ? WHERE id = ?',
// //             [is_published ? 1 : 0, blogId]
// //         );

// //         if (result.affectedRows === 0) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: 'Blog not found.'
// //             });
// //         }

// //         res.json({
// //             success: true,
// //             message: is_published ? 'Blog published.' : 'Blog unpublished.'
// //         });
// //     } catch (error) {
// //         console.error('Toggle publish error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Failed to update blog status.',
// //             error: error.message
// //         });
// //     }
// // });

// // // Toggle blog featured status
// // router.patch('/blogs/:id/featured', authenticate, requireAdmin, async (req, res) => {
// //     try {
// //         const blogId = req.params.id;
// //         const { is_featured } = req.body;

// //         const result = await query(
// //             'UPDATE blogs SET is_featured = ? WHERE id = ?',
// //             [is_featured ? 1 : 0, blogId]
// //         );

// //         if (result.affectedRows === 0) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: 'Blog not found.'
// //             });
// //         }

// //         res.json({
// //             success: true,
// //             message: is_featured ? 'Blog marked as featured.' : 'Blog removed from featured.'
// //         });
// //     } catch (error) {
// //         console.error('Toggle featured error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Failed to update featured status.',
// //             error: error.message
// //         });
// //     }
// // });

// // // Delete blog (admin can delete any blog)
// // router.delete('/blogs/:id', authenticate, requireAdmin, async (req, res) => {
// //     try {
// //         const blogId = req.params.id;

// //         await query('DELETE FROM comments WHERE blog_id = ?', [blogId]);
// //         await query('DELETE FROM ratings WHERE blog_id = ?', [blogId]);

// //         const result = await query('DELETE FROM blogs WHERE id = ?', [blogId]);

// //         if (result.affectedRows === 0) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: 'Blog not found.'
// //             });
// //         }

// //         res.json({
// //             success: true,
// //             message: 'Blog deleted successfully!'
// //         });
// //     } catch (error) {
// //         console.error('Delete blog error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Failed to delete blog.',
// //             error: error.message
// //         });
// //     }
// // });

// // // Get all comments (admin view)
// // router.get('/comments', authenticate, requireAdmin, async (req, res) => {
// //     try {
// //         const page = parseInt(req.query.page) || 1;
// //         const limit = parseInt(req.query.limit) || 20;
// //         const offset = (page - 1) * limit;

// //         const [countResult] = await query('SELECT COUNT(*) as total FROM comments');
// //         const total = countResult[0].total;
// //         const totalPages = Math.ceil(total / limit);

// //         const comments = await query(
// //             `SELECT c.*, u.name as user_name, b.title as blog_title
// //              FROM comments c
// //              LEFT JOIN users u ON c.user_id = u.id
// //              LEFT JOIN blogs b ON c.blog_id = b.id
// //              ORDER BY c.created_at DESC
// //              LIMIT ? OFFSET ?`,
// //             [limit, offset]
// //         );

// //         res.json({
// //             success: true,
// //             data: {
// //                 comments,
// //                 pagination: {
// //                     current_page: page,
// //                     total_pages: totalPages,
// //                     total_items: total,
// //                     items_per_page: limit,
// //                     has_next: page < totalPages,
// //                     has_prev: page > 1
// //                 }
// //             }
// //         });
// //     } catch (error) {
// //         console.error('Get admin comments error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Failed to fetch comments.',
// //             error: error.message
// //         });
// //     }
// // });

// // // Delete comment
// // router.delete('/comments/:id', authenticate, requireAdmin, async (req, res) => {
// //     try {
// //         const commentId = req.params.id;

// //         const result = await query('DELETE FROM comments WHERE id = ?', [commentId]);

// //         if (result.affectedRows === 0) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: 'Comment not found.'
// //             });
// //         }

// //         res.json({
// //             success: true,
// //             message: 'Comment deleted successfully!'
// //         });
// //     } catch (error) {
// //         console.error('Delete comment error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Failed to delete comment.',
// //             error: error.message
// //         });
// //     }
// // });

// // module.exports = router;

















// /**
//  * ContentCraft Admin Routes
//  * Admin dashboard and management operations
//  */

// const express = require('express');
// const router = express.Router();
// const { query } = require('../../database/db');
// const { authenticate } = require('../middleware/auth');
// const { getFileUrl } = require('../middleware/upload');

// function requireAdmin(req, res, next) {
//     if (!req.user) {
//         return res.status(401).json({
//             success: false,
//             message: 'Authentication required.'
//         });
//     }
    
//     if (req.user.role !== 'admin') {
//         return res.status(403).json({
//             success: false,
//             message: 'Admin access required.',
//             currentRole: req.user.role
//         });
//     }
//     next();
// }

// // Get dashboard statistics
// router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
//     try {
//         const [userCount] = await query('SELECT COUNT(*) as count FROM users');
//         const [blogCount] = await query('SELECT COUNT(*) as count FROM blogs');
//         const [commentCount] = await query('SELECT COUNT(*) as count FROM comments');
//         const [messageCount] = await query('SELECT COUNT(*) as count FROM messages WHERE is_read = FALSE');
//         const [categoryCount] = await query('SELECT COUNT(*) as count FROM categories');

//         const recentUsers = await query(
//             `SELECT id, name, email, role, created_at 
//              FROM users 
//              ORDER BY created_at DESC 
//              LIMIT 5`
//         );

//         const recentBlogs = await query(
//             `SELECT b.id, b.title, b.views, b.created_at, u.name as author_name
//              FROM blogs b
//              LEFT JOIN users u ON b.author_id = u.id
//              ORDER BY b.created_at DESC
//              LIMIT 5`
//         );

//         const popularBlogs = await query(
//             `SELECT b.id, b.title, b.views, u.name as author_name
//              FROM blogs b
//              LEFT JOIN users u ON b.author_id = u.id
//              ORDER BY b.views DESC
//              LIMIT 5`
//         );

//         res.json({
//             success: true,
//             data: {
//                 stats: {
//                     total_users: userCount[0].count,
//                     total_blogs: blogCount[0].count,
//                     total_comments: commentCount[0].count,
//                     unread_messages: messageCount[0].count,
//                     total_categories: categoryCount[0].count
//                 },
//                 recent_users: recentUsers,
//                 recent_blogs: recentBlogs,
//                 popular_blogs: popularBlogs
//             }
//         });
//     } catch (error) {
//         console.error('Get dashboard error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to fetch dashboard data.',
//             error: error.message
//         });
//     }
// });

// // Get all users (with pagination and search)
// router.get('/users', authenticate, requireAdmin, async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const offset = (page - 1) * limit;
//         const search = req.query.search || '';

//         let whereClause = '';
//         const params = [];

//         if (search) {
//             whereClause = 'WHERE name LIKE ? OR email LIKE ?';
//             const searchTerm = `%${search}%`;
//             params.push(searchTerm, searchTerm);
//         }

//         const countResult = await query(
//             `SELECT COUNT(*) as total FROM users ${whereClause}`,
//             params
//         );
//         const total = countResult[0].total;
//         const totalPages = Math.ceil(total / limit);

//         const users = await query(
//             `SELECT u.id, u.name, u.email, u.role, u.avatar, u.created_at,
//                     COUNT(DISTINCT b.id) as blog_count,
//                     COUNT(DISTINCT c.id) as comment_count
//              FROM users u
//              LEFT JOIN blogs b ON u.id = b.author_id
//              LEFT JOIN comments c ON u.id = c.user_id
//              ${whereClause}
//              GROUP BY u.id
//              ORDER BY u.created_at DESC
//              LIMIT ? OFFSET ?`,
//             [...params, limit, offset]
//         );

//         const formattedUsers = users.map(user => ({
//             ...user,
//             avatar_url: getFileUrl(user.avatar, 'avatars')
//         }));

//         res.json({
//             success: true,
//             data: {
//                 users: formattedUsers,
//                 pagination: {
//                     current_page: page,
//                     total_pages: totalPages,
//                     total_items: total,
//                     items_per_page: limit,
//                     has_next: page < totalPages,
//                     has_prev: page > 1
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('Get users error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to fetch users.',
//             error: error.message
//         });
//     }
// });

// // Update user role
// router.patch('/users/:id/role', authenticate, requireAdmin, async (req, res) => {
//     try {
//         const userId = req.params.id;
//         const { role } = req.body;

//         if (!['user', 'admin'].includes(role)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid role. Must be "user" or "admin".'
//             });
//         }

//         if (parseInt(userId) === req.user.id && role === 'user') {
//             return res.status(400).json({
//                 success: false,
//                 message: 'You cannot change your own role to user.'
//             });
//         }

//         const result = await query(
//             'UPDATE users SET role = ? WHERE id = ?',
//             [role, userId]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found.'
//             });
//         }

//         res.json({
//             success: true,
//             message: `User role updated to ${role}.`
//         });
//     } catch (error) {
//         console.error('Update user role error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to update user role.',
//             error: error.message
//         });
//     }
// });

// // Delete user
// router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
//     try {
//         const userId = req.params.id;

//         if (parseInt(userId) === req.user.id) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'You cannot delete your own account.'
//             });
//         }

//         // Delete user's comments first
//         await query('DELETE FROM comments WHERE user_id = ?', [userId]);
//         // Delete user's ratings
//         await query('DELETE FROM ratings WHERE user_id = ?', [userId]);
//         // Delete user's blogs (cascade will handle comments/ratings of those blogs)
//         await query('DELETE FROM blogs WHERE author_id = ?', [userId]);
//         // Finally delete the user
//         const result = await query('DELETE FROM users WHERE id = ?', [userId]);

//         if (result.affectedRows === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found.'
//             });
//         }

//         res.json({
//             success: true,
//             message: 'User deleted successfully!'
//         });
//     } catch (error) {
//         console.error('Delete user error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to delete user.',
//             error: error.message
//         });
//     }
// });

// // Get all blogs for admin (with pagination and search)
// router.get('/blogs', authenticate, requireAdmin, async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const offset = (page - 1) * limit;
//         const search = req.query.search || '';

//         let whereClause = '';
//         const params = [];

//         if (search) {
//             whereClause = 'WHERE b.title LIKE ? OR b.description LIKE ?';
//             const searchTerm = `%${search}%`;
//             params.push(searchTerm, searchTerm);
//         }

//         const countResult = await query(
//             `SELECT COUNT(*) as total FROM blogs b ${whereClause}`,
//             params
//         );
//         const total = countResult[0].total;
//         const totalPages = Math.ceil(total / limit);

//         const blogs = await query(
//             `SELECT b.*, 
//                     u.name as author_name, 
//                     u.email as author_email,
//                     c.name as category_name,
//                     COUNT(DISTINCT com.id) as comment_count,
//                     AVG(r.rating) as avg_rating
//              FROM blogs b
//              LEFT JOIN users u ON b.author_id = u.id
//              LEFT JOIN categories c ON b.category_id = c.id
//              LEFT JOIN comments com ON b.id = com.blog_id
//              LEFT JOIN ratings r ON b.id = r.blog_id
//              ${whereClause}
//              GROUP BY b.id
//              ORDER BY b.created_at DESC
//              LIMIT ? OFFSET ?`,
//             [...params, limit, offset]
//         );

//         const formattedBlogs = blogs.map(blog => ({
//             ...blog,
//             image_url: getFileUrl(blog.image, 'blogs'),
//             avg_rating: blog.avg_rating ? parseFloat(blog.avg_rating).toFixed(1) : null,
//             is_published: blog.is_published === 1 || blog.is_published === true,
//             is_featured: blog.is_featured === 1 || blog.is_featured === true
//         }));

//         res.json({
//             success: true,
//             data: {
//                 blogs: formattedBlogs,
//                 pagination: {
//                     current_page: page,
//                     total_pages: totalPages,
//                     total_items: total,
//                     items_per_page: limit,
//                     has_next: page < totalPages,
//                     has_prev: page > 1
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('Get admin blogs error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to fetch blogs.',
//             error: error.message
//         });
//     }
// });

// // Toggle blog featured status
// router.patch('/blogs/:id/featured', authenticate, requireAdmin, async (req, res) => {
//     try {
//         const blogId = req.params.id;
//         const { is_featured } = req.body;

//         // Convert to boolean/
//                 // Convert to boolean/ integer
//         const featuredValue = is_featured ? 1 : 0;

//         const result = await query(
//             'UPDATE blogs SET is_featured = ? WHERE id = ?',
//             [featuredValue, blogId]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Blog not found.'
//             });
//         }

//         // Get updated blog
//         const [updatedBlog] = await query(
//             `SELECT b.*, u.name as author_name, c.name as category_name 
//              FROM blogs b
//              LEFT JOIN users u ON b.author_id = u.id
//              LEFT JOIN categories c ON b.category_id = c.id
//              WHERE b.id = ?`,
//             [blogId]
//         );

//         res.json({
//             success: true,
//             message: is_featured ? 'Blog marked as featured.' : 'Blog removed from featured.',
//             data: {
//                 blog: {
//                     ...updatedBlog,
//                     image_url: getFileUrl(updatedBlog.image, 'blogs'),
//                     is_featured: updatedBlog.is_featured === 1
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('Toggle featured error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to update featured status.',
//             error: error.message
//         });
//     }
// });

// // Toggle blog publish status
// router.patch('/blogs/:id/publish', authenticate, requireAdmin, async (req, res) => {
//     try {
//         const blogId = req.params.id;
//         const { is_published } = req.body;

//         const publishValue = is_published ? 1 : 0;

//         const result = await query(
//             'UPDATE blogs SET is_published = ? WHERE id = ?',
//             [publishValue, blogId]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Blog not found.'
//             });
//         }

//         res.json({
//             success: true,
//             message: is_published ? 'Blog published.' : 'Blog unpublished.'
//         });
//     } catch (error) {
//         console.error('Toggle publish error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to update blog status.',
//             error: error.message
//         });
//     }
// });

// // Delete blog (admin can delete any blog)
// router.delete('/blogs/:id', authenticate, requireAdmin, async (req, res) => {
//     try {
//         const blogId = req.params.id;

//         // Get blog image to delete later
//         const [blog] = await query('SELECT image FROM blogs WHERE id = ?', [blogId]);

//         // Delete comments first
//         await query('DELETE FROM comments WHERE blog_id = ?', [blogId]);
//         // Delete ratings
//         await query('DELETE FROM ratings WHERE blog_id = ?', [blogId]);
//         // Delete the blog
//         const result = await query('DELETE FROM blogs WHERE id = ?', [blogId]);

//         if (result.affectedRows === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Blog not found.'
//             });
//         }

//         // Delete image file if exists
//         if (blog && blog.image) {
//             const { deleteFile } = require('../middleware/upload');
//             deleteFile(blog.image, 'blogs');
//         }

//         res.json({
//             success: true,
//             message: 'Blog deleted successfully!'
//         });
//     } catch (error) {
//         console.error('Delete blog error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to delete blog.',
//             error: error.message
//         });
//     }
// });

// // Get all comments (admin view)
// router.get('/comments', authenticate, requireAdmin, async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 20;
//         const offset = (page - 1) * limit;

//         const [countResult] = await query('SELECT COUNT(*) as total FROM comments');
//         const total = countResult[0].total;
//         const totalPages = Math.ceil(total / limit);

//         const comments = await query(
//             `SELECT c.*, u.name as user_name, u.email as user_email, b.title as blog_title
//              FROM comments c
//              LEFT JOIN users u ON c.user_id = u.id
//              LEFT JOIN blogs b ON c.blog_id = b.id
//              ORDER BY c.created_at DESC
//              LIMIT ? OFFSET ?`,
//             [limit, offset]
//         );

//         res.json({
//             success: true,
//             data: {
//                 comments,
//                 pagination: {
//                     current_page: page,
//                     total_pages: totalPages,
//                     total_items: total,
//                     items_per_page: limit,
//                     has_next: page < totalPages,
//                     has_prev: page > 1
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('Get admin comments error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to fetch comments.',
//             error: error.message
//         });
//     }
// });

// // Delete comment (admin only)
// router.delete('/comments/:id', authenticate, requireAdmin, async (req, res) => {
//     try {
//         const commentId = req.params.id;

//         const result = await query('DELETE FROM comments WHERE id = ?', [commentId]);

//         if (result.affectedRows === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Comment not found.'
//             });
//         }

//         res.json({
//             success: true,
//             message: 'Comment deleted successfully!'
//         });
//     } catch (error) {
//         console.error('Delete comment error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to delete comment.',
//             error: error.message
//         });
//     }
// });

// module.exports = router;






















/**
 * ContentCraft Admin Routes
 * Admin dashboard and management operations
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');
const { authenticate } = require('../middleware/auth');
const { getFileUrl, deleteFile } = require('../middleware/upload');

function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required.',
            currentRole: req.user.role
        });
    }
    next();
}

// Get dashboard statistics
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
    try {
        console.log('Fetching admin dashboard data...');
        
        // Get total users
        const [userResult] = await query('SELECT COUNT(*) as count FROM users');
        const total_users = userResult.count;
        
        // Get total blogs
        const [blogResult] = await query('SELECT COUNT(*) as count FROM blogs');
        const total_blogs = blogResult.count;
        
        // Get total comments
        const [commentResult] = await query('SELECT COUNT(*) as count FROM comments');
        const total_comments = commentResult.count;
        
        // Get unread messages
        const [messageResult] = await query('SELECT COUNT(*) as count FROM messages WHERE is_read = FALSE');
        const unread_messages = messageResult.count;
        
        // Get total categories
        const [categoryResult] = await query('SELECT COUNT(*) as count FROM categories');
        const total_categories = categoryResult.count;

        // Get recent users (last 5)
        const recentUsers = await query(
            `SELECT id, name, email, role, avatar, created_at 
             FROM users 
             ORDER BY created_at DESC 
             LIMIT 5`
        );

        // Get recent blogs (last 5)
        const recentBlogs = await query(
            `SELECT b.id, b.title, b.views, b.created_at, b.is_published, b.is_featured,
                    u.name as author_name, u.avatar as author_avatar
             FROM blogs b
             LEFT JOIN users u ON b.author_id = u.id
             ORDER BY b.created_at DESC
             LIMIT 5`
        );

        // Get popular blogs (most viewed)
        const popularBlogs = await query(
            `SELECT b.id, b.title, b.views, b.created_at,
                    u.name as author_name
             FROM blogs b
             LEFT JOIN users u ON b.author_id = u.id
             ORDER BY b.views DESC
             LIMIT 5`
        );

        // Format the data
        const formattedRecentUsers = recentUsers.map(user => ({
            ...user,
            avatar_url: getFileUrl(user.avatar, 'avatars')
        }));

        const formattedRecentBlogs = recentBlogs.map(blog => ({
            ...blog,
            image_url: getFileUrl(blog.image, 'blogs'),
            author_avatar_url: getFileUrl(blog.author_avatar, 'avatars')
        }));

        const formattedPopularBlogs = popularBlogs.map(blog => ({
            ...blog,
            image_url: getFileUrl(blog.image, 'blogs')
        }));

        // Send response
        res.json({
            success: true,
            data: {
                stats: {
                    total_users,
                    total_blogs,
                    total_comments,
                    unread_messages,
                    total_categories
                },
                recent_users: formattedRecentUsers,
                recent_blogs: formattedRecentBlogs,
                popular_blogs: formattedPopularBlogs
            }
        });

    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data.',
            error: error.message
        });
    }
});

// Get all users (with pagination and search)
router.get('/users', authenticate, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let whereClause = '';
        const params = [];

        if (search) {
            whereClause = 'WHERE name LIKE ? OR email LIKE ?';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        const countResult = await query(
            `SELECT COUNT(*) as total FROM users ${whereClause}`,
            params
        );
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        const users = await query(
            `SELECT u.id, u.name, u.email, u.role, u.avatar, u.created_at,
                    COUNT(DISTINCT b.id) as blog_count,
                    COUNT(DISTINCT c.id) as comment_count
             FROM users u
             LEFT JOIN blogs b ON u.id = b.author_id
             LEFT JOIN comments c ON u.id = c.user_id
             ${whereClause}
             GROUP BY u.id
             ORDER BY u.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const formattedUsers = users.map(user => ({
            ...user,
            avatar_url: getFileUrl(user.avatar, 'avatars')
        }));

        res.json({
            success: true,
            data: {
                users: formattedUsers,
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
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users.',
            error: error.message
        });
    }
});

// Update user role
router.patch('/users/:id/role', authenticate, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be "user" or "admin".'
            });
        }

        if (parseInt(userId) === req.user.id && role === 'user') {
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own role to user.'
            });
        }

        const result = await query(
            'UPDATE users SET role = ? WHERE id = ?',
            [role, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        res.json({
            success: true,
            message: `User role updated to ${role}.`
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user role.',
            error: error.message
        });
    }
});

// Delete user
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;

        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account.'
            });
        }

        // Delete user's comments first
        await query('DELETE FROM comments WHERE user_id = ?', [userId]);
        // Delete user's ratings
        await query('DELETE FROM ratings WHERE user_id = ?', [userId]);
        // Delete user's blogs
        await query('DELETE FROM blogs WHERE author_id = ?', [userId]);
        // Finally delete the user
        const result = await query('DELETE FROM users WHERE id = ?', [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully!'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user.',
            error: error.message
        });
    }
});

// Get all blogs for admin (with pagination and search)
router.get('/blogs', authenticate, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let whereClause = '';
        const params = [];

        if (search) {
            whereClause = 'WHERE b.title LIKE ? OR b.description LIKE ?';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        const countResult = await query(
            `SELECT COUNT(*) as total FROM blogs b ${whereClause}`,
            params
        );
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        const blogs = await query(
            `SELECT b.*, 
                    u.name as author_name, 
                    u.email as author_email,
                    u.avatar as author_avatar,
                    c.name as category_name,
                    COUNT(DISTINCT com.id) as comment_count,
                    AVG(r.rating) as avg_rating
             FROM blogs b
             LEFT JOIN users u ON b.author_id = u.id
             LEFT JOIN categories c ON b.category_id = c.id
             LEFT JOIN comments com ON b.id = com.blog_id
             LEFT JOIN ratings r ON b.id = r.blog_id
             ${whereClause}
             GROUP BY b.id
             ORDER BY b.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const formattedBlogs = blogs.map(blog => ({
            ...blog,
            image_url: getFileUrl(blog.image, 'blogs'),
            author_avatar_url: getFileUrl(blog.author_avatar, 'avatars'),
            avg_rating: blog.avg_rating ? parseFloat(blog.avg_rating).toFixed(1) : null,
            is_published: blog.is_published === 1 || blog.is_published === true,
            is_featured: blog.is_featured === 1 || blog.is_featured === true
        }));

        res.json({
            success: true,
            data: {
                blogs: formattedBlogs,
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
        console.error('Get admin blogs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blogs.',
            error: error.message
        });
    }
});

// Toggle blog featured status
router.patch('/blogs/:id/featured', authenticate, requireAdmin, async (req, res) => {
    try {
        const blogId = req.params.id;
        const { is_featured } = req.body;

        const featuredValue = is_featured ? 1 : 0;

        const result = await query(
            'UPDATE blogs SET is_featured = ? WHERE id = ?',
            [featuredValue, blogId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found.'
            });
        }

        // Get updated blog
        const [updatedBlog] = await query(
            `SELECT b.*, u.name as author_name, c.name as category_name 
             FROM blogs b
             LEFT JOIN users u ON b.author_id = u.id
             LEFT JOIN categories c ON b.category_id = c.id
             WHERE b.id = ?`,
            [blogId]
        );

        res.json({
            success: true,
            message: is_featured ? 'Blog marked as featured.' : 'Blog removed from featured.',
            data: {
                blog: {
                    ...updatedBlog,
                    image_url: getFileUrl(updatedBlog.image, 'blogs'),
                    is_featured: updatedBlog.is_featured === 1
                }
            }
        });
    } catch (error) {
        console.error('Toggle featured error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update featured status.',
            error: error.message
        });
    }
});

// Toggle blog publish status
router.patch('/blogs/:id/publish', authenticate, requireAdmin, async (req, res) => {
    try {
        const blogId = req.params.id;
        const { is_published } = req.body;

        const publishValue = is_published ? 1 : 0;

        const result = await query(
            'UPDATE blogs SET is_published = ? WHERE id = ?',
            [publishValue, blogId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found.'
            });
        }

        res.json({
            success: true,
            message: is_published ? 'Blog published.' : 'Blog unpublished.'
        });
    } catch (error) {
        console.error('Toggle publish error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update blog status.',
            error: error.message
        });
    }
});

// Delete blog (admin can delete any blog)
router.delete('/blogs/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const blogId = req.params.id;

        // Get blog image to delete later
        const [blog] = await query('SELECT image FROM blogs WHERE id = ?', [blogId]);

        // Delete comments first
        await query('DELETE FROM comments WHERE blog_id = ?', [blogId]);
        // Delete ratings
        await query('DELETE FROM ratings WHERE blog_id = ?', [blogId]);
        // Delete the blog
        const result = await query('DELETE FROM blogs WHERE id = ?', [blogId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found.'
            });
        }

        // Delete image file if exists
        if (blog && blog.image) {
            deleteFile(blog.image, 'blogs');
        }

        res.json({
            success: true,
            message: 'Blog deleted successfully!'
        });
    } catch (error) {
        console.error('Delete blog error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete blog.',
            error: error.message
        });
    }
});

// Get all comments (admin view)
router.get('/comments', authenticate, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [countResult] = await query('SELECT COUNT(*) as total FROM comments');
        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);

        const comments = await query(
            `SELECT c.*, u.name as user_name, u.email as user_email, b.title as blog_title
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
                    items_per_page: limit,
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get admin comments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch comments.',
            error: error.message
        });
    }
});

// Delete comment (admin only)
router.delete('/comments/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const commentId = req.params.id;

        const result = await query('DELETE FROM comments WHERE id = ?', [commentId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found.'
            });
        }

        res.json({
            success: true,
            message: 'Comment deleted successfully!'
        });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete comment.',
            error: error.message
        });
    }
});

module.exports = router;
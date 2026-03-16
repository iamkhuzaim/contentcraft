/**
 * ContentCraft Blog Routes
 * Blog CRUD operations, search, filter, and sorting
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { blogValidation } = require('../middleware/validation');
const { uploadBlogImage, getFileUrl, deleteFile } = require('../middleware/upload');

function validateBlogId(req, res, next) {
    const id = req.params.id;
    if (!id || !/^\d+$/.test(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid blog ID. ID must be a number.'
        });
    }
    next();
}

// Get featured blogs - ordered by featured flag and popularity
router.get('/featured/list', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const countResult = await query(
            `SELECT COUNT(*) as total FROM blogs WHERE is_published = TRUE AND is_featured = TRUE`
        );
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        const blogs = await query(
            `SELECT 
                b.id, b.title, b.description, b.image, b.views, b.created_at,
                u.name as author_name,
                u.role as author_role,
                c.name as category_name,
                AVG(r.rating) as avg_rating,
                COUNT(DISTINCT com.id) as comment_count
             FROM blogs b
             LEFT JOIN users u ON b.author_id = u.id
             LEFT JOIN categories c ON b.category_id = c.id
             LEFT JOIN ratings r ON b.id = r.blog_id
             LEFT JOIN comments com ON b.id = com.blog_id
             WHERE b.is_published = TRUE AND b.is_featured = TRUE
             GROUP BY b.id
             ORDER BY b.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const formattedBlogs = blogs.map(blog => ({
            ...blog,
            image_url: getFileUrl(blog.image, 'blogs'),
            avg_rating: blog.avg_rating ? parseFloat(blog.avg_rating).toFixed(1) : null,
            author_name: blog.author_name
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
        console.error('Get featured blogs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch featured blogs.'
        });
    }
});

// Get latest blogs - ordered by creation date (newest first)
router.get('/latest/list', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const countResult = await query(
            `SELECT COUNT(*) as total FROM blogs WHERE is_published = TRUE`
        );
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        const blogs = await query(
            `SELECT 
                b.id, b.title, b.description, b.image, b.views, b.created_at,
                u.name as author_name,
                u.role as author_role,
                c.name as category_name,
                AVG(r.rating) as avg_rating,
                COUNT(DISTINCT com.id) as comment_count
             FROM blogs b
             LEFT JOIN users u ON b.author_id = u.id
             LEFT JOIN categories c ON b.category_id = c.id
             LEFT JOIN ratings r ON b.id = r.blog_id
             LEFT JOIN comments com ON b.id = com.blog_id
             WHERE b.is_published = TRUE
             GROUP BY b.id
             ORDER BY b.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const formattedBlogs = blogs.map(blog => ({
            ...blog,
            image_url: getFileUrl(blog.image, 'blogs'),
            avg_rating: blog.avg_rating ? parseFloat(blog.avg_rating).toFixed(1) : null,
            author_name: blog.author_name
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
        console.error('Get latest blogs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch latest blogs.'
        });
    }
});

// Get popular blogs - ordered by views
router.get('/popular/list', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const countResult = await query(
            `SELECT COUNT(*) as total FROM blogs WHERE is_published = TRUE`
        );
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        const blogs = await query(
            `SELECT 
                b.id, b.title, b.description, b.image, b.views, b.created_at,
                u.name as author_name,
                u.role as author_role,
                c.name as category_name,
                AVG(r.rating) as avg_rating
             FROM blogs b
             LEFT JOIN users u ON b.author_id = u.id
             LEFT JOIN categories c ON b.category_id = c.id
             LEFT JOIN ratings r ON b.id = r.blog_id
             WHERE b.is_published = TRUE
             GROUP BY b.id
             ORDER BY b.views DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const formattedBlogs = blogs.map(blog => ({
            ...blog,
            image_url: getFileUrl(blog.image, 'blogs'),
            avg_rating: blog.avg_rating ? parseFloat(blog.avg_rating).toFixed(1) : null,
            author_name: blog.author_name
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
        console.error('Get popular blogs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch popular blogs.'
        });
    }
});

// Get all blogs with pagination, filtering, and sorting
router.get('/', blogValidation.list, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        const category = req.query.category ? parseInt(req.query.category) : null;
        const sort = req.query.sort || 'latest';
        const search = req.query.search;

        let orderBy = 'b.created_at DESC';
        switch (sort) {
            case 'oldest':
                orderBy = 'b.created_at ASC';
                break;
            case 'popular':
                orderBy = 'b.views DESC';
                break;
            case 'rated':
                orderBy = 'avg_rating DESC';
                break;
        }

        const whereConditions = ['b.is_published = 1'];
        const whereValues = [];

        if (category) {
            whereConditions.push('b.category_id = ?');
            whereValues.push(category);
        }

        if (search) {
            whereConditions.push('(b.title LIKE ? OR b.description LIKE ? OR b.content LIKE ?)');
            const searchTerm = `%${search}%`;
            whereValues.push(searchTerm, searchTerm, searchTerm);
        }

        const whereClause = whereConditions.join(' AND ');

        const countResult = await query(
            `SELECT COUNT(*) as total FROM blogs b WHERE ${whereClause}`,
            whereValues
        );
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        const blogs = await query(
            `SELECT 
                b.id, b.title, b.description, b.image, b.views, b.created_at, b.updated_at,  
                u.id as author_id, u.name as author_name, u.avatar as author_avatar, u.role as author_role,
                c.id as category_id, c.name as category_name,
                COUNT(DISTINCT com.id) as comment_count,
                AVG(r.rating) as avg_rating,
                COUNT(DISTINCT r.id) as rating_count
             FROM blogs b
             LEFT JOIN users u ON b.author_id = u.id
             LEFT JOIN categories c ON b.category_id = c.id
             LEFT JOIN comments com ON b.id = com.blog_id
             LEFT JOIN ratings r ON b.id = r.blog_id
             WHERE ${whereClause}
             GROUP BY b.id
             ORDER BY ${orderBy}
             LIMIT ? OFFSET ?`,
            [...whereValues, limit, offset]
        );

        const formattedBlogs = blogs.map(blog => ({
            ...blog,
            image_url: getFileUrl(blog.image, 'blogs'),
            author_avatar_url: getFileUrl(blog.author_avatar, 'avatars'),
            avg_rating: blog.avg_rating ? parseFloat(blog.avg_rating).toFixed(1) : null,
            author_name: blog.author_name
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
        console.error('Get blogs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blogs.'
        });
    }
});

// Get single blog by ID
router.get('/:id', optionalAuth, validateBlogId, async (req, res) => {
    try {
        const blogId = req.params.id;
        const userId = req.user?.id;

        const blogs = await query(
            `SELECT 
                b.id, b.title, b.description, b.content, b.image, b.views, 
                b.created_at, b.updated_at,
                u.id as author_id, u.name as author_name, u.avatar as author_avatar, u.bio as author_bio,
                c.id as category_id, c.name as category_name,
                AVG(r.rating) as avg_rating,
                COUNT(DISTINCT r.id) as rating_count
             FROM blogs b
             LEFT JOIN users u ON b.author_id = u.id
             LEFT JOIN categories c ON b.category_id = c.id
             LEFT JOIN ratings r ON b.id = r.blog_id
             WHERE b.id = ? AND b.is_published = 1
             GROUP BY b.id`,
            [blogId]
        );

        if (blogs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found.'
            });
        }

        const blog = blogs[0];

        await query('UPDATE blogs SET views = views + 1 WHERE id = ?', [blogId]);
        blog.views += 1;

        let userRating = null;
        if (userId) {
            const ratings = await query(
                'SELECT rating FROM ratings WHERE blog_id = ? AND user_id = ?',
                [blogId, userId]
            );
            if (ratings.length > 0) {
                userRating = ratings[0].rating;
            }
        }

        const comments = await query(
            `SELECT 
                c.id, c.comment, c.created_at,
                u.id as user_id, u.name as user_name, u.avatar as user_avatar
             FROM comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.blog_id = ?
             ORDER BY c.created_at DESC`,
            [blogId]
        );

        const formattedBlog = {
            ...blog,
            image_url: getFileUrl(blog.image, 'blogs'),
            author_avatar_url: getFileUrl(blog.author_avatar, 'avatars'),
            avg_rating: blog.avg_rating ? parseFloat(blog.avg_rating).toFixed(1) : null,
            user_rating: userRating,
            content: blog.content,
            comments: comments.map(c => ({
                ...c,
                user_avatar_url: getFileUrl(c.user_avatar, 'avatars')
            }))
        };

        res.json({
            success: true,
            data: { blog: formattedBlog }
        });
    } catch (error) {
        console.error('Get blog error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blog.'
        });
    }
});

// Create new blog (Admin only)
router.post('/', authenticate, uploadBlogImage.single('image'), blogValidation.create, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required.'
            });
        }

        const { title, description, content, category_id } = req.body;
        const image = req.file ? req.file.filename : null;

        let processedContent = content;
        if (!content.includes('<p>') && !content.includes('<br>')) {
            processedContent = content
                .split('\n\n')
                .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
                .join('\n\n');
        }

        const result = await query(
            `INSERT INTO blogs 
             (title, description, content, image, author_id, category_id, is_published, published_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW(), NOW())`,
            [title, description, processedContent, image, req.user.id, category_id]
        );

        const blogId = result.insertId;

        const blogs = await query(
            `SELECT b.*, u.name as author_name, c.name as category_name 
             FROM blogs b
             LEFT JOIN users u ON b.author_id = u.id
             LEFT JOIN categories c ON b.category_id = c.id
             WHERE b.id = ?`,
            [blogId]
        );

        const blog = blogs[0];
        blog.image_url = blog.image ? getFileUrl(blog.image, 'blogs') : null;

        res.status(201).json({
            success: true,
            message: 'Blog created successfully!',
            data: { blog }
        });

    } catch (error) {
        console.error('Create blog error:', error);
        if (req.file) {
            deleteFile(req.file.filename, 'blogs');
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create blog.',
            error: error.message
        });
    }
});

// Update blog (Admin only)
router.put('/:id', authenticate, validateBlogId, uploadBlogImage.single('image'), blogValidation.update, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required.'
            });
        }

        const blogId = req.params.id;
        const { title, description, content, category_id } = req.body;

        const existingBlogs = await query(
            'SELECT id, image FROM blogs WHERE id = ?', 
            [blogId]
        );
        
        if (existingBlogs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found.'
            });
        }

        const existingBlog = existingBlogs[0];

        const updates = [];
        const values = [];

        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (content !== undefined) {
            let processedContent = content;
            if (!content.includes('<p>') && !content.includes('<br>')) {
                processedContent = content
                    .split('\n\n')
                    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
                    .join('\n\n');
            }
            updates.push('content = ?');
            values.push(processedContent);
        }
        if (category_id !== undefined) {
            updates.push('category_id = ?');
            values.push(category_id);
        }
        if (req.file) {
            updates.push('image = ?');
            values.push(req.file.filename);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update.'
            });
        }

        updates.push('updated_at = NOW()');
        values.push(blogId);

        await query(`UPDATE blogs SET ${updates.join(', ')} WHERE id = ?`, values);

        if (req.file && existingBlog.image) {
            deleteFile(existingBlog.image, 'blogs');
        }

        const blogs = await query(
            `SELECT b.*, u.name as author_name, c.name as category_name 
             FROM blogs b
             LEFT JOIN users u ON b.author_id = u.id
             LEFT JOIN categories c ON b.category_id = c.id
             WHERE b.id = ?`,
            [blogId]
        );

        const blog = blogs[0];
        blog.image_url = getFileUrl(blog.image, 'blogs');

        res.json({
            success: true,
            message: 'Blog updated successfully!',
            data: { blog }
        });

    } catch (error) {
        console.error('Update blog error:', error);
        if (req.file) {
            deleteFile(req.file.filename, 'blogs');
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update blog.'
        });
    }
});

// Delete blog (Admin only)
router.delete('/:id', authenticate, validateBlogId, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required.'
            });
        }

        const blogId = req.params.id;

        const blogs = await query('SELECT image FROM blogs WHERE id = ?', [blogId]);
        
        if (blogs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found.'
            });
        }

        await query('DELETE FROM comments WHERE blog_id = ?', [blogId]);
        await query('DELETE FROM ratings WHERE blog_id = ?', [blogId]);
        await query('DELETE FROM blogs WHERE id = ?', [blogId]);

        if (blogs[0].image) {
            deleteFile(blogs[0].image, 'blogs');
        }

        res.json({
            success: true,
            message: 'Blog deleted successfully!'
        });
    } catch (error) {
        console.error('Delete blog error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete blog.'
        });
    }
});

// Add comment to blog
router.post('/:id/comments', authenticate, validateBlogId, async (req, res) => {
    try {
        const blogId = req.params.id;
        const { comment } = req.body;
        const userId = req.user.id;

        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Comment text is required.'
            });
        }

        const result = await query(
            'INSERT INTO comments (blog_id, user_id, comment, created_at) VALUES (?, ?, ?, NOW())',
            [blogId, userId, comment.trim()]
        );

        res.status(201).json({
            success: true,
            message: 'Comment added successfully!',
            data: { commentId: result.insertId }
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add comment.'
        });
    }
});

// Delete comment
router.delete('/:id/comments/:commentId', authenticate, validateBlogId, async (req, res) => {
    try {
        const { id: blogId, commentId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        const comments = await query(
            'SELECT user_id FROM comments WHERE id = ? AND blog_id = ?',
            [commentId, blogId]
        );

        if (comments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found.'
            });
        }

        if (!isAdmin && comments[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own comments.'
            });
        }

        await query('DELETE FROM comments WHERE id = ?', [commentId]);

        res.json({
            success: true,
            message: 'Comment deleted successfully!'
        });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete comment.'
        });
    }
});

// Add or update rating
router.post('/:id/ratings', authenticate, validateBlogId, async (req, res) => {
    try {
        const blogId = req.params.id;
        const { rating } = req.body;
        const userId = req.user.id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5.'
            });
        }

        const existing = await query(
            'SELECT id FROM ratings WHERE blog_id = ? AND user_id = ?',
            [blogId, userId]
        );

        if (existing.length > 0) {
            await query(
                'UPDATE ratings SET rating = ? WHERE blog_id = ? AND user_id = ?',
                [rating, blogId, userId]
            );
        } else {
            await query(
                'INSERT INTO ratings (blog_id, user_id, rating, created_at) VALUES (?, ?, ?, NOW())',
                [blogId, userId, rating]
            );
        }

        const [stats] = await query(
            'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM ratings WHERE blog_id = ?',
            [blogId]
        );

        res.json({
            success: true,
            message: 'Rating submitted successfully!',
            data: {
                avg_rating: parseFloat(stats.avg_rating).toFixed(1),
                rating_count: stats.count
            }
        });
    } catch (error) {
        console.error('Add rating error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit rating.'
        });
    }
});

module.exports = router;
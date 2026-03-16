/**
 * ContentCraft Messages Routes
 * Contact form submissions
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { contactValidation } = require('../middleware/validation');

// Submit contact form (Public)
router.post('/', contactValidation.submit, async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        const result = await query(
            'INSERT INTO messages (name, email, phone, message, is_read, created_at) VALUES (?, ?, ?, ?, FALSE, NOW())',
            [name, email, phone || null, message]
        );

        res.status(201).json({
            success: true,
            message: 'Message sent successfully! We will get back to you soon.',
            data: { messageId: result.insertId }
        });
    } catch (error) {
        console.error('Submit message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again.'
        });
    }
});

// Get all messages (Admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const unreadOnly = req.query.unread === 'true';

        let whereClause = '';
        const params = [];

        if (unreadOnly) {
            whereClause = 'WHERE is_read = FALSE';
        }

        const countResult = await query(
            `SELECT COUNT(*) as total FROM messages ${whereClause}`,
            params
        );
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        const messages = await query(
            `SELECT * FROM messages 
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json({
            success: true,
            data: {
                messages,
                pagination: {
                    current_page: page,
                    total_pages: totalPages,
                    total_items: total,
                    items_per_page: limit
                }
            }
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages.'
        });
    }
});

// Get single message (Admin only)
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const messageId = req.params.id;

        const messages = await query('SELECT * FROM messages WHERE id = ?', [messageId]);

        if (messages.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Message not found.'
            });
        }

        res.json({
            success: true,
            data: { message: messages[0] }
        });
    } catch (error) {
        console.error('Get message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch message.'
        });
    }
});

// Mark message as read (Admin only)
router.patch('/:id/read', authenticate, requireAdmin, async (req, res) => {
    try {
        const messageId = req.params.id;

        await query('UPDATE messages SET is_read = TRUE WHERE id = ?', [messageId]);

        res.json({
            success: true,
            message: 'Message marked as read.'
        });
    } catch (error) {
        console.error('Mark message read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark message as read.'
        });
    }
});

// Delete message (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const messageId = req.params.id;

        const result = await query('DELETE FROM messages WHERE id = ?', [messageId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Message not found.'
            });
        }

        res.json({
            success: true,
            message: 'Message deleted successfully!'
        });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete message.'
        });
    }
});

module.exports = router;
/**
 * ContentCraft FAQ Routes
 * Manage frequently asked questions
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Get all FAQs (Public)
router.get('/', async (req, res) => {
    try {
        const category = req.query.category;
        let sql = 'SELECT * FROM faqs WHERE is_published = TRUE';
        const params = [];

        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }

        sql += ' ORDER BY display_order ASC, created_at DESC';

        const faqs = await query(sql, params);

        const categories = await query(
            'SELECT DISTINCT category FROM faqs WHERE is_published = TRUE ORDER BY category'
        );

        res.json({
            success: true,
            data: {
                faqs,
                categories: categories.map(c => c.category)
            }
        });
    } catch (error) {
        console.error('Get FAQs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch FAQs.'
        });
    }
});

// Get single FAQ
router.get('/:id', async (req, res) => {
    try {
        const faqId = req.params.id;

        const faqs = await query(
            'SELECT * FROM faqs WHERE id = ? AND is_published = TRUE',
            [faqId]
        );

        if (faqs.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found.'
            });
        }

        res.json({
            success: true,
            data: { faq: faqs[0] }
        });
    } catch (error) {
        console.error('Get FAQ error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch FAQ.'
        });
    }
});

// Create FAQ (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { question, answer, category, display_order } = req.body;

        if (!question || !answer) {
            return res.status(400).json({
                success: false,
                message: 'Question and answer are required.'
            });
        }

        const result = await query(
            'INSERT INTO faqs (question, answer, category, display_order, created_at) VALUES (?, ?, ?, ?, NOW())',
            [question, answer, category || 'general', display_order || 0]
        );

        const faqs = await query('SELECT * FROM faqs WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'FAQ created successfully!',
            data: { faq: faqs[0] }
        });
    } catch (error) {
        console.error('Create FAQ error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create FAQ.'
        });
    }
});

// Update FAQ (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const faqId = req.params.id;
        const { question, answer, category, display_order, is_published } = req.body;

        const updates = [];
        const values = [];

        if (question !== undefined) {
            updates.push('question = ?');
            values.push(question);
        }
        if (answer !== undefined) {
            updates.push('answer = ?');
            values.push(answer);
        }
        if (category !== undefined) {
            updates.push('category = ?');
            values.push(category);
        }
        if (display_order !== undefined) {
            updates.push('display_order = ?');
            values.push(display_order);
        }
        if (is_published !== undefined) {
            updates.push('is_published = ?');
            values.push(is_published ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update.'
            });
        }

        values.push(faqId);
        await query(`UPDATE faqs SET ${updates.join(', ')} WHERE id = ?`, values);

        const faqs = await query('SELECT * FROM faqs WHERE id = ?', [faqId]);

        res.json({
            success: true,
            message: 'FAQ updated successfully!',
            data: { faq: faqs[0] }
        });
    } catch (error) {
        console.error('Update FAQ error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update FAQ.'
        });
    }
});

// Delete FAQ (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const faqId = req.params.id;

        const result = await query('DELETE FROM faqs WHERE id = ?', [faqId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found.'
            });
        }

        res.json({
            success: true,
            message: 'FAQ deleted successfully!'
        });
    } catch (error) {
        console.error('Delete FAQ error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete FAQ.'
        });
    }
});

module.exports = router;
/**
 * ContentCraft Categories Routes
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Get all categories with blog count
router.get('/', async (req, res) => {
    try {
        const categories = await query(
            `SELECT c.id, c.name, c.description, c.icon, c.created_at,
                    COUNT(DISTINCT b.id) as blog_count
             FROM categories c
             LEFT JOIN blogs b ON c.id = b.category_id AND b.is_published = TRUE
             GROUP BY c.id
             ORDER BY c.name`
        );

        res.json({
            success: true,
            data: { categories }
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories.'
        });
    }
});

// Get single category
router.get('/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;

        const categories = await query(
            `SELECT c.*, COUNT(DISTINCT b.id) as blog_count
             FROM categories c
             LEFT JOIN blogs b ON c.id = b.category_id AND b.is_published = TRUE
             WHERE c.id = ?
             GROUP BY c.id`,
            [categoryId]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found.'
            });
        }

        res.json({
            success: true,
            data: { category: categories[0] }
        });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category.'
        });
    }
});

// Create category (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { name, description, icon } = req.body;

        const existing = await query('SELECT id FROM categories WHERE name = ?', [name]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Category already exists.'
            });
        }

        const result = await query(
            'INSERT INTO categories (name, description, icon, created_at) VALUES (?, ?, ?, NOW())',
            [name, description, icon || 'fa-folder']
        );

        const categories = await query('SELECT * FROM categories WHERE id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Category created successfully!',
            data: { category: categories[0] }
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create category.'
        });
    }
});

// Update category (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { name, description, icon } = req.body;

        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (icon !== undefined) {
            updates.push('icon = ?');
            values.push(icon);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update.'
            });
        }

        values.push(categoryId);
        await query(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, values);

        const categories = await query('SELECT * FROM categories WHERE id = ?', [categoryId]);

        res.json({
            success: true,
            message: 'Category updated successfully!',
            data: { category: categories[0] }
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update category.'
        });
    }
});

// Delete category (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const categoryId = req.params.id;

        const result = await query('DELETE FROM categories WHERE id = ?', [categoryId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Category not found.'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully!'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete category.'
        });
    }
});

module.exports = router;
/**
 * ContentCraft Site Settings Routes
 * Manage About page content, Contact info, and other site settings
 */

const express = require('express');
const router = express.Router();
const { query } = require('../../database/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Get all settings (Public)
router.get('/', async (req, res) => {
    try {
        const settings = await query('SELECT setting_key, setting_value FROM site_settings');
        
        const settingsObj = {};
        settings.forEach(setting => {
            settingsObj[setting.setting_key] = setting.setting_value;
        });

        res.json({
            success: true,
            data: { settings: settingsObj }
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch settings.'
        });
    }
});

// Get specific setting (Public)
router.get('/:key', async (req, res) => {
    try {
        const key = req.params.key;

        const settings = await query(
            'SELECT setting_key, setting_value FROM site_settings WHERE setting_key = ?',
            [key]
        );

        if (settings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found.'
            });
        }

        res.json({
            success: true,
            data: { setting: settings[0] }
        });
    } catch (error) {
        console.error('Get setting error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch setting.'
        });
    }
});

// Update setting (Admin only)
router.put('/:key', authenticate, requireAdmin, async (req, res) => {
    try {
        const key = req.params.key;
        const { value } = req.body;

        await query(
            `INSERT INTO site_settings (setting_key, setting_value) 
             VALUES (?, ?) 
             ON DUPLICATE KEY UPDATE setting_value = ?`,
            [key, value, value]
        );

        res.json({
            success: true,
            message: 'Setting updated successfully!'
        });
    } catch (error) {
        console.error('Update setting error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update setting.'
        });
    }
});

// Update multiple settings (Admin only)
router.put('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const settings = req.body;

        if (typeof settings !== 'object' || settings === null) {
            return res.status(400).json({
                success: false,
                message: 'Invalid settings format.'
            });
        }

        for (const [key, value] of Object.entries(settings)) {
            await query(
                `INSERT INTO site_settings (setting_key, setting_value) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE setting_value = ?`,
                [key, value, value]
            );
        }

        res.json({
            success: true,
            message: 'Settings updated successfully!'
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings.'
        });
    }
});

// Get contact info (Public)
router.get('/group/contact', async (req, res) => {
    try {
        const settings = await query(
            "SELECT setting_key, setting_value FROM site_settings WHERE setting_key LIKE 'contact_%'"
        );
        
        const contactInfo = {};
        settings.forEach(setting => {
            contactInfo[setting.setting_key] = setting.setting_value;
        });

        res.json({
            success: true,
            data: { contact: contactInfo }
        });
    } catch (error) {
        console.error('Get contact info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contact info.'
        });
    }
});

// Get about info (Public)
router.get('/group/about', async (req, res) => {
    try {
        const settings = await query(
            "SELECT setting_key, setting_value FROM site_settings WHERE setting_key LIKE 'about_%'"
        );
        
        const aboutInfo = {};
        settings.forEach(setting => {
            aboutInfo[setting.setting_key] = setting.setting_value;
        });

        res.json({
            success: true,
            data: { about: aboutInfo }
        });
    } catch (error) {
        console.error('Get about info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch about info.'
        });
    }
});

// Get social links (Public)
router.get('/group/social', async (req, res) => {
    try {
        const settings = await query(
            "SELECT setting_key, setting_value FROM site_settings WHERE setting_key LIKE 'social_%'"
        );
        
        const socialLinks = {};
        settings.forEach(setting => {
            const platform = setting.setting_key.replace('social_', '');
            socialLinks[platform] = setting.setting_value;
        });

        res.json({
            success: true,
            data: { social: socialLinks }
        });
    } catch (error) {
        console.error('Get social links error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch social links.'
        });
    }
});

module.exports = router;
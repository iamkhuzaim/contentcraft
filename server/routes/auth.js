/**
 * ContentCraft Authentication Routes
 * User registration, login, and profile management
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../../database/db');
const { generateToken, authenticate } = require('../middleware/auth');
const { userValidation } = require('../middleware/validation');
const { uploadAvatar, getFileUrl, deleteFile } = require('../middleware/upload');

// Register
router.post('/register', userValidation.register, async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUsers = await query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await query(
            'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, "user", NOW())',
            [name, email, hashedPassword]
        );

        const userId = result.insertId;

        const users = await query(
            'SELECT id, name, email, role, avatar, bio, phone, location, website, created_at FROM users WHERE id = ?',
            [userId]
        );

        const user = users[0];
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            data: {
                token,
                user: {
                    ...user,
                    avatar_url: getFileUrl(user.avatar, 'avatars')
                }
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
});

// Login
router.post('/login', userValidation.login, async (req, res) => {
    try {
        const { email, password } = req.body;

        const users = await query(
            'SELECT id, name, email, password, role, avatar, bio, phone, location, website, created_at FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful!',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    bio: user.bio,
                    phone: user.phone,
                    location: user.location,
                    website: user.website,
                    created_at: user.created_at,
                    avatar_url: getFileUrl(user.avatar, 'avatars')
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
    try {
        const users = await query(
            'SELECT id, name, email, role, avatar, bio, phone, location, website, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
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
                    ...user,
                    avatar_url: getFileUrl(user.avatar, 'avatars')
                }
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user data.'
        });
    }
});

// Update profile
router.put('/profile', authenticate, userValidation.updateProfile, async (req, res) => {
    try {
        const { name, bio, phone, location, website } = req.body;
        const userId = req.user.id;

        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (bio !== undefined) {
            updates.push('bio = ?');
            values.push(bio);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            values.push(phone);
        }
        if (location !== undefined) {
            updates.push('location = ?');
            values.push(location);
        }
        if (website !== undefined) {
            updates.push('website = ?');
            values.push(website);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update.'
            });
        }

        updates.push('updated_at = NOW()');
        values.push(userId);

        await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

        const users = await query(
            'SELECT id, name, email, role, avatar, bio, phone, location, website, created_at FROM users WHERE id = ?',
            [userId]
        );

        const user = users[0];

        res.json({
            success: true,
            message: 'Profile updated successfully!',
            data: {
                user: {
                    ...user,
                    avatar_url: getFileUrl(user.avatar, 'avatars')
                }
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile.'
        });
    }
});

// Upload avatar
router.post('/avatar', authenticate, uploadAvatar.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided.'
            });
        }

        const userId = req.user.id;
        const avatarFilename = req.file.filename;

        const users = await query('SELECT avatar FROM users WHERE id = ?', [userId]);
        const oldAvatar = users[0]?.avatar;

        await query('UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?', [avatarFilename, userId]);

        if (oldAvatar && oldAvatar !== avatarFilename) {
            deleteFile(oldAvatar, 'avatars');
        }

        res.json({
            success: true,
            message: 'Avatar updated successfully!',
            data: {
                avatar_url: getFileUrl(avatarFilename, 'avatars')
            }
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        if (req.file) {
            deleteFile(req.file.filename, 'avatars');
        }
        res.status(500).json({
            success: false,
            message: 'Failed to upload avatar.'
        });
    }
});

// Change password
router.put('/password', authenticate, userValidation.changePassword, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const users = await query('SELECT password FROM users WHERE id = ?', [userId]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect.'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await query('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, userId]);

        res.json({
            success: true,
            message: 'Password changed successfully!'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password.'
        });
    }
});

module.exports = router;
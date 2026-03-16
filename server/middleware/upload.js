/**
 * ContentCraft File Upload Middleware
 * Multer configuration for image uploads
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const uploadDirs = {
    blogs: path.join(__dirname, '../../uploads/blogs'),
    avatars: path.join(__dirname, '../../uploads/avatars'),
    covers: path.join(__dirname, '../../uploads/covers')
};

Object.values(uploadDirs).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('Created upload directory:', dir);
    }
});

const createStorage = (folder) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDirs[folder]);
        },
        filename: (req, file, cb) => {
            const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
            cb(null, uniqueName);
        }
    });
};

const imageFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
    }
};

const uploadBlogImage = multer({
    storage: createStorage('blogs'),
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
    },
    fileFilter: imageFilter
});

const uploadAvatar = multer({
    storage: createStorage('avatars'),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: imageFilter
});

const uploadCover = multer({
    storage: createStorage('covers'),
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: imageFilter
});

const handleUploadError = (err, req, res, next) => {
    console.log('Upload error handler triggered:', err);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size exceeded.'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    next();
};

const deleteFile = (filename, folder) => {
    if (!filename) return;
    
    const filePath = path.join(uploadDirs[folder], filename);
    
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Deleted file:', filePath);
    }
};

const getFileUrl = (filename, folder) => {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename;
    return `/uploads/${folder}/${filename}`;
};

module.exports = {
    uploadBlogImage,
    uploadAvatar,
    uploadCover,
    handleUploadError,
    deleteFile,
    getFileUrl,
    uploadDirs
};
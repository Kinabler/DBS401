const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
    // Change from '../../public/uploads' to '../public/uploads' to store in src/public/uploads
    const uploadDir = path.join(__dirname, '../public/uploads');
    const profileDir = path.join(uploadDir, 'profiles');

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    if (!fs.existsSync(profileDir)) {
        fs.mkdirSync(profileDir, { recursive: true });
    }

    return { uploadDir, profileDir };
};

// Configure storage options
const { profileDir } = createUploadDirs();

// Define storage configuration for profile uploads
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profileDir);
    },
    filename: (req, file, cb) => {
        // Create a unique filename with user ID and timestamp
        const userId = req.user?.userId || 'unknown';
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        cb(null, `profile_${userId}_${timestamp}${extension}`);
    }
});

// File filter function for avatars
const avatarFileFilter = (req, file, cb) => {
    // Accept only images
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed for avatars (.jpg, .png, .gif, .webp)'), false);
    }
};

// Create the multer uploader for profile avatars
const uploadAvatar = multer({
    storage: profileStorage,
    fileFilter: avatarFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB limit
    }
}).single('avatar'); // 'avatar' is the name of the form field

// Create middleware that can be used in routes
const handleAvatarUpload = (req, res, next) => {
    uploadAvatar(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred during upload
            console.error('Multer upload error:', err);
            req.fileUploadError = `Upload failed: ${err.message}`;
            return next();
        } else if (err) {
            // A non-Multer error occurred
            console.error('Upload error:', err);
            req.fileUploadError = `Upload failed: ${err.message}`;
            return next();
        }

        // File upload was successful
        if (req.file) {
            // Add the file path to the request for use in controllers
            req.filePath = `/uploads/profiles/${req.file.filename}`;
            console.log(`File uploaded successfully: ${req.filePath}`);
        }

        return next();
    });
};

module.exports = {
    handleAvatarUpload
};

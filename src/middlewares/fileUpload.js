const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist with proper error handling
const createUploadDirs = () => {
    try {
        // Use absolute paths that match with Docker setup
        const uploadDir = path.join(__dirname, '../public/uploads');
        const profileDir = path.join(uploadDir, 'profiles');
        const memesDir = path.join(uploadDir, 'memes');

        // Create directories with proper permissions
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
        }

        if (!fs.existsSync(profileDir)) {
            fs.mkdirSync(profileDir, { recursive: true, mode: 0o755 });
        }

        if (!fs.existsSync(memesDir)) {
            fs.mkdirSync(memesDir, { recursive: true, mode: 0o755 });
        }

        console.log('Upload directories created successfully');
        return { uploadDir, profileDir, memesDir };
    } catch (error) {
        console.error('Error creating upload directories:', error);
        // If directory creation fails, try to use existing directories
        const uploadDir = path.join(__dirname, '../public/uploads');
        const profileDir = path.join(uploadDir, 'profiles');
        const memesDir = path.join(uploadDir, 'memes');

        return { uploadDir, profileDir, memesDir };
    }
};

// Initialize directories
const { profileDir, memesDir } = createUploadDirs();

// Define storage configuration for profile uploads
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Double-check directory exists before using it
        if (!fs.existsSync(profileDir)) {
            try {
                fs.mkdirSync(profileDir, { recursive: true, mode: 0o755 });
            } catch (error) {
                console.error('Failed to create profile directory:', error);
                return cb(error);
            }
        }
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

// Define storage configuration for meme uploads - SECURED
const memeStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Double-check directory exists before using it
        if (!fs.existsSync(memesDir)) {
            try {
                fs.mkdirSync(memesDir, { recursive: true, mode: 0o755 });
            } catch (error) {
                console.error('Failed to create memes directory:', error);
                return cb(error);
            }
        }
        cb(null, memesDir);
    },
    filename: (req, file, cb) => {
        // SECURITY: Properly sanitize the filename to prevent path traversal
        const originalName = file.originalname;
        // Use path.basename to strip any path components
        const safeBaseName = path.basename(originalName);
        // Extract extension safely
        const extension = path.extname(safeBaseName);
        // Only keep alphanumeric characters plus some safe ones in the base name
        const sanitizedName = path.basename(safeBaseName, extension)
            .replace(/[^a-zA-Z0-9_-]/g, '_');

        // Create a safe filename
        const newFilename = `meme_${Date.now()}_${sanitizedName}${extension}`;
        console.log("Creating sanitized filename:", newFilename);
        cb(null, newFilename);
    }
});

// Improved file filter - checking both mime type and extension
const memeFileFilter = (req, file, cb) => {
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

    // Check MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPG, PNG, GIF, WEBP) are allowed'), false);
    }
};

// Create the meme uploader
const uploadMeme = multer({
    storage: memeStorage,
    fileFilter: memeFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB limit
    }
}).single('meme'); // 'meme' is the name of the form field

// Create middleware that can be used in routes
const handleMemeUpload = (req, res, next) => {
    uploadMeme(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer upload error:', err);
            req.fileUploadError = `Upload failed: ${err.message}`;
            return next();
        } else if (err) {
            console.error('Upload error:', err);
            req.fileUploadError = `Upload failed: ${err.message}`;
            return next();
        }

        // File upload was successful
        if (req.file) {
            req.filePath = `/uploads/memes/${req.file.filename}`;
            console.log(`Meme uploaded: ${req.filePath}`);
        }

        next();
    });
};

// Export the handlers
module.exports = {
    handleAvatarUpload,
    handleMemeUpload
};
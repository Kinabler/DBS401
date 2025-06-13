const express = require('express');
const router = express.Router();
const { getHomePage, getAboutPage, getListUserPage, postEditUserById, getUploadMemePage, uploadMeme, getLoginPage, postLogin, logout, getUserProfilePage, updateUserProfile, checkDatabaseStatus } = require('../controllers/user_controller');
const { verifyToken } = require('../middlewares/accessToken');
const { addLoginStatus } = require('../middlewares/viewHelpers');
const { handleAvatarUpload, handleMemeUpload } = require('../middlewares/fileUpload');
const fs = require('fs');
const path = require('path');

// Apply login status middleware to all routes
router.use(addLoginStatus);

// Public routes
router.get('/login', getLoginPage);
router.post('/login', postLogin);
router.get('/logout', logout); // No need for verification to logout

// Home and About - accessible to everyone
router.get('/', getHomePage);
router.get('/about', getAboutPage);

// Users routes - protected and requires admin check
router.get('/user/list', verifyToken, checkAdminRole, getListUserPage);
router.post('/user/edit/:id', verifyToken, checkAdminRole, postEditUserById);

// VULNERABLE Meme upload routes - admin only
router.get('/user/upload-meme', verifyToken, checkAdminRole, getUploadMemePage);
router.post('/user/upload-meme', verifyToken, checkAdminRole, handleMemeUpload, uploadMeme);

// Profile routes - available to all logged-in users
router.get('/user/profile', verifyToken, getUserProfilePage);
// Add handleAvatarUpload middleware before updateUserProfile
router.post('/user/profile/update', verifyToken, handleAvatarUpload, updateUserProfile);

// // VULNERABLE Route - Special handler for common LFI targets
// router.get('/read-file', verifyToken, (req, res) => {
//     const filePath = req.query.path;

//     if (!filePath) {
//         return res.status(400).send('No file path specified');
//     }

//     try {
//         // VULNERABILITY: No path validation at all
//         const fullPath = path.resolve(filePath);
//         console.log(`LFI attempt to read: ${fullPath}`);

//         if (fs.existsSync(fullPath)) {
//             const content = fs.readFileSync(fullPath, 'utf8');
//             res.setHeader('Content-Type', 'text/plain');
//             return res.send(content);
//         } else {
//             return res.status(404).send('File not found');
//         }
//     } catch (error) {
//         console.error(`Error reading file: ${error.message}`);
//         return res.status(500).send(`Error: ${error.message}`);
//     }
// });

// // VULNERABLE: Debug endpoint that intentionally leaks environment variables
// router.get('/debug/env', verifyToken, checkAdminRole, (req, res) => {
//     const envData = Object.entries(process.env)
//         .map(([key, value]) => `${key}=${value}`)
//         .join('\n');

//     res.setHeader('Content-Type', 'text/plain');
//     res.send(envData);
// });

// OS Command Injection - Database check (vulnerable)
router.get('/database', verifyToken, checkAdminRole, (req, res) => {
    const dbHost = process.env.DB_CHECK_STRING || 'localhost';
    res.send(`
        <form method="post">
            <input type="hidden" name="dbhost" value="${dbHost}">
            <button type="submit">Check DB</button>
        </form>
        <pre></pre>
    `);
});
router.post('/database', verifyToken, checkAdminRole, checkDatabaseStatus);

module.exports = router;

// Middleware to check if user is admin
function checkAdminRole(req, res, next) {
    if (res.locals.userRole === 'admin') {
        return next();
    }
    res.status(403).send('Access denied: Admin privileges required');
}
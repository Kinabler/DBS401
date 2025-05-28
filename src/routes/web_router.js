const express = require('express');
const router = express.Router();
const { getHomePage, getAboutPage, getListUserPage, postEditUserById, getUploadMemePage, uploadMeme, getLoginPage, postLogin, logout, getUserProfilePage, updateUserProfile } = require('../controllers/user_controller');
const { verifyToken } = require('../middlewares/accessToken');
const { addLoginStatus } = require('../middlewares/viewHelpers');
const { handleAvatarUpload, handleMemeUpload } = require('../middlewares/fileUpload');

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

module.exports = router;

// Middleware to check if user is admin
function checkAdminRole(req, res, next) {
    if (res.locals.userRole === 'admin') {
        return next();
    }
    res.status(403).send('Access denied: Admin privileges required');
}
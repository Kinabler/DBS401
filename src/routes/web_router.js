const express = require('express');
const router = express.Router();
const { getHomePage, getAboutPage, getListUserPage, postEditUserById, getAddUserPage, getLoginPage, postLogin, logout, getUserProfilePage, updateUserProfile } = require('../controllers/user_controller');
const { verifyToken } = require('../middlewares/accessToken');
const { addLoginStatus } = require('../middlewares/viewHelpers');

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
router.get('/user/create', verifyToken, checkAdminRole, getAddUserPage);

// Profile routes - available to all logged-in users
router.get('/user/profile', verifyToken, getUserProfilePage);
router.post('/user/profile/update', verifyToken, updateUserProfile); // Add this new route

module.exports = router;

// Middleware to check if user is admin
function checkAdminRole(req, res, next) {
    if (res.locals.userRole === 'admin') {
        return next();
    }
    res.status(403).send('Access denied: Admin privileges required');
}
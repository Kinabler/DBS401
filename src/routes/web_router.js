const express = require('express');
const router = express.Router();
const { getHomePage, getAboutPage, getListUserPage, postEditUserById, getAddUserPage, getLoginPage, postLogin, logout } = require('../controllers/user_controller');
const { verifyToken } = require('../middlewares/accessToken');

// Public routes
router.get('/login', getLoginPage);
router.post('/login', postLogin);
router.get('/logout', logout); // Add logout route

// Protected routes (require authentication)
router.get('/', getHomePage);
router.get('/user/list', verifyToken, getListUserPage)
router.post('/user/edit/:id', verifyToken, postEditUserById);
router.get('/user/create', verifyToken, getAddUserPage)
router.get('/about', getAboutPage);


module.exports = router;
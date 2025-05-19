const express = require('express');
const router = express.Router();
const { getHomePage, getAboutPage, getListUserPage, postEditUserById, getUserCreatePage, getAddUserPage, postAddUser } = require('../controllers/user_controller');

router.get('/', getHomePage);
router.get('/user/list', getListUserPage)
router.post('/user/edit/:id', postEditUserById);

// Add user routes
router.get('/user/add', getAddUserPage);
router.post('/user/add', postAddUser);

router.get('/about', getAboutPage);

module.exports = router;
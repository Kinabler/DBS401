const express = require('express');
const router = express.Router();
const { getHomePage, getAboutPage, getListUserPage } = require('../controller/user_controller');

router.get('/', getHomePage);
router.get('/user/list', getListUserPage)
router.get('/about', getAboutPage);

module.exports = router;
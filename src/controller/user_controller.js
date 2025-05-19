const e = require('express');
const { getUserFromDB } = require('../services/CRUD_service');

const getHomePage = async (req, res) => {
    res.render('homePage');
};

const getAboutPage = async (req, res) => {
    res.render('aboutPage');
}

const getListUserPage = async (req, res) => {
    const listUser = await getUserFromDB();
    res.render('listUserPage', { listUser });
}

module.exports = {
    getHomePage,
    getAboutPage,
    getListUserPage,
};
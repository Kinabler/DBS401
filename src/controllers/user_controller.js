const e = require('express');
const { getUserFromDB, getUserByIdInDB, updateUserInDB } = require('../services/CRUD_service');

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

const postEditUserById = async (req, res) => {
    const { id } = req.params;
    try {
        // Here you would typically update the user in the database
        // For now, we'll just log the data to the console
        console.log(`Editing user with ID: ${id}`);
        console.log('Form data:', req.body);

        const result = await getUserByIdInDB(id);
        console.log('Current user data:', result);

        // Update the user in database with new data from form data
        const resultUpdate = await updateUserInDB(req.body);
        if (resultUpdate.rowsAffected === 0) {
            console.log('Update failed: No rows affected');
        }
        console.log('User updated successfully:', resultUpdate);

        // Redirect back to the list user page
        res.redirect('/user/list');
    } catch (error) {
        console.error('Error editing user:', error);
        res.status(500).send('Error processing your request');
    }
};

const getAddUserPage = async (req, res) => {
    res.render('createUserPage');
};

const postAddUser = async (req, res) => {
    try {
        const { name, address, phone, hobbies, birthdate, gender } = req.body;

        // Here you would call a service to add the user to the database
        // For example: const result = await addUserToDB(name, address, phone, hobbies, birthdate, gender);

        console.log('Adding new user:', req.body);

        // Redirect to the user list page after successful addition
        res.redirect('/user/list');
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).send('Error processing your request');
    }
};

module.exports = {
    getHomePage,
    getAboutPage,
    getListUserPage,
    postEditUserById,
    getAddUserPage,
    postAddUser,
};
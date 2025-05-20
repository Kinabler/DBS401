const e = require('express');
const { getUserFromDB, getUserByIdInDB, updateUserInDB } = require('../services/CRUD_service');
const { authenticateUser } = require('../services/auth_service');

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
    try {
        const { id } = req.params;
        const { name, address, phone, hobbies, birthdate, gender, userId } = req.body;

        // console.log('Form data received:', req.body);

        // Create the data object for updating
        const userData = {
            profile_id: id || userId,  // Use param ID or form ID
            full_name: name,
            address: address,
            phone_number: phone,
            hobbies: hobbies,
            birthday: new Date(birthdate),  // Ensure proper date format
            gender: gender.trim()  // Trim any whitespace
        };

        // Log the prepared data
        // console.log('Data being sent to update service:', userData);

        // Call the update service
        const result = await updateUserInDB(userData);

        // Log the result
        console.log('Update completed:', result);

        // Redirect back to the user list
        res.redirect('/user/list');
    } catch (error) {
        console.error('Error in edit user:', error);
        res.status(500).send(`Error processing your request: ${error.message}`);
    }
};

const getAddUserPage = async (req, res) => {
    res.render('createUserPage');
};

const getLoginPage = async (req, res) => {
    res.render('loginPage', { errorMessage: null });
};

// Add logout handler
const logout = async (req, res) => {
    // Clear the auth token cookie
    res.clearCookie('auth_token');
    // Redirect to login page
    res.redirect('/login');
};

const postLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.render('loginPage', { errorMessage: 'Username and password are required' });
        }

        // Basic input sanitization
        const sanitizedUsername = username.trim();
        const sanitizedPassword = password.trim();

        // Check credentials and get JWT token
        const result = await authenticateUser(sanitizedUsername, sanitizedPassword);

        if (result.success) {
            // Set JWT token in cookie
            res.cookie('auth_token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Set to true in production
                maxAge: 3600000 // 1 hour
            });

            // Redirect to home page or dashboard
            return res.redirect('/');
        } else {
            // Authentication failed
            return res.render('loginPage', { errorMessage: result.message });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('loginPage', { errorMessage: 'An error occurred during login' });
    }
};

// Add user profile page handler
const getUserProfilePage = async (req, res) => {
    try {
        // You might want to fetch the user's data based on their token
        // For now, we'll just render a basic profile page
        res.render('profilePage', {
            user: {
                name: res.locals.username || 'User',
                role: res.locals.userRole || 'user'
            }
        });
    } catch (error) {
        console.error('Error loading profile page:', error);
        res.status(500).send('Error loading profile page');
    }
};

module.exports = {
    getHomePage,
    getAboutPage,
    getListUserPage,
    postEditUserById,
    getAddUserPage,
    getLoginPage,
    postLogin,
    logout,
    getUserProfilePage
};
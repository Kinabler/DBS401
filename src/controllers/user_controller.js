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

// Update user profile page handler
const getUserProfilePage = async (req, res) => {
    try {
        // Get user ID from the request (set by verifyToken middleware)
        const userId = req.user.userId;

        if (!userId) {
            console.log('No user ID found in token');
            return res.redirect('/login');
        }

        // Fetch complete user data from the database
        try {
            const userData = await getUserByIdInDB(userId);

            if (!userData || userData.length === 0) {
                console.log('No user profile found for ID:', userId);
                // Temporarily just show a basic profile with minimal info
                return res.render('profilePage', {
                    user: {
                        name: res.locals.username || 'User',
                        role: res.locals.userRole || 'user',
                        email: res.locals.email || '',
                        avatarUrl: '/uploads/default_profile.webp' // Default avatar
                    },
                    req: req
                });
            }

            // Format the user data for the template
            const user = {
                id: userId,
                name: userData[0][2] || res.locals.username || 'User', // full_name
                role: res.locals.userRole || 'user',
                email: res.locals.email || '',
                phone: userData[0][4] || '', // phone_number
                address: userData[0][3] || '', // address
                hobbies: userData[0][5] || '', // hobbies
                gender: userData[0][8] || 'Not specified', // gender
                birthdate: userData[0][6] ? new Date(userData[0][6]).toLocaleDateString() : 'Not specified', // birthday
                joinDate: userData[0][7] ? new Date(userData[0][7]).toLocaleDateString() : 'Not available', // created_at
                avatarUrl: userData[0][9] || '/uploads/default_profile.webp' // avatar_url or default
            };

            console.log('Prepared user data for profile:', user);

            // Pass the updated user object to the template
            res.render('profilePage', { user, req });
        } catch (dbError) {
            console.error('Database error when fetching user profile:', dbError);
            // Fallback to basic profile
            res.render('profilePage', {
                user: {
                    name: res.locals.username || 'User',
                    role: res.locals.userRole || 'user'
                },
                req: req
            });
        }
    } catch (error) {
        console.error('Error loading profile page:', error);
        res.status(500).render('500Page');
    }
};

// Add profile update handler
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId; // Get from the token/session
        const { name, phone, address, hobbies, birthdate, gender } = req.body;

        console.log('Updating profile for user:', userId);
        console.log('Profile update data:', { name, phone, address, hobbies, birthdate, gender });

        // Update the fields that the user is allowed to change
        const userData = {
            profile_id: userId,  // This is actually the user_id from JWT
            full_name: name,
            phone_number: phone,
            address: address,
            hobbies: hobbies,
            // Add new fields
            birthday: birthdate ? new Date(birthdate) : undefined,
            gender: gender || null
        };

        await updateUserInDB(userData);

        // Redirect back to the profile page with a success message
        res.redirect('/user/profile?updated=true');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.redirect('/user/profile?error=true');
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
    getUserProfilePage,
    updateUserProfile  // Export the new function
};
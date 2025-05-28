const e = require('express');
const { getUserFromDB, getUserByIdInDB, updateUserInDB } = require('../services/CRUD_service');
const { authenticateUser } = require('../services/auth_service');
const {
    validateUserId,
    validateLoginData,
    validateUserProfileData,
    validateFileUpload
} = require('../utils/inputValidator');
const { get } = require('../routes/web_router');

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

        // Validate the ID parameter
        const idValidation = validateUserId(id || userId);
        if (!idValidation.success) {
            console.error('Invalid user ID:', idValidation.message);
            return res.status(400).send(`Invalid request: ${idValidation.message}`);
        }

        // Prepare data for validation
        const inputData = {
            profile_id: idValidation.value,
            full_name: name,
            address: address,
            phone_number: phone,
            hobbies: hobbies,
            birthday: birthdate,
            gender: gender
        };

        // Validate all input data
        const validation = validateUserProfileData(inputData);
        if (!validation.success) {
            console.error('Validation error:', validation.message);
            return res.status(400).send(`Invalid input: ${validation.message}`);
        }

        // Use validated and sanitized data
        const userData = validation.data;

        console.log('Validated data being sent to update service:', userData);

        // Call the update service with validated data
        const result = await updateUserInDB(userData);

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

        // Validate login credentials
        const validation = validateLoginData({ username, password });
        if (!validation.success) {
            console.log('Login validation failed:', validation.message);
            return res.render('loginPage', { errorMessage: validation.message });
        }

        // Use validated credentials
        const { username: validUsername, password: validPassword } = validation.data;

        console.log('Attempting login with validated credentials');

        // Check credentials and get JWT token
        const result = await authenticateUser(validUsername, validPassword);

        if (result.success) {
            // Set JWT token in cookie
            res.cookie('auth_token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 3600000 // 1 hour
            });

            console.log('Login successful for user:', validUsername);
            return res.redirect('/');
        } else {
            // Authentication failed
            console.log('Authentication failed:', result.message);
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

        // Validate user ID
        const validation = validateUserId(userId);
        if (!validation.success) {
            console.error('Invalid user ID in token:', validation.message);
            return res.redirect('/login');
        }

        // Fetch complete user data from the database
        try {
            const userData = await getUserByIdInDB(validation.value);

            if (!userData || userData.length === 0) {
                console.log('No user profile found for ID:', userId);
                return res.render('profilePage', {
                    user: {
                        name: res.locals.username || 'User',
                        role: res.locals.userRole || 'user',
                        email: res.locals.email || '',
                        avatarUrl: '/uploads/default_profile.webp'
                    },
                    req: req
                });
            }

            // Format the user data for the template
            const user = {
                id: userId,
                name: userData[0][2] || res.locals.username || 'User',
                role: res.locals.userRole || 'user',
                email: res.locals.email || '',
                phone: userData[0][4] || '',
                address: userData[0][3] || '',
                hobbies: userData[0][5] || '',
                gender: userData[0][8] || 'Not specified',
                birthdate: userData[0][6] ? new Date(userData[0][6]).toLocaleDateString() : 'Not specified',
                joinDate: userData[0][7] ? new Date(userData[0][7]).toLocaleDateString() : 'Not available',
                avatarUrl: userData[0][9] || '/uploads/default_profile.webp'
            };

            console.log('Prepared user data for profile:', user);

            res.render('profilePage', { user, req });
        } catch (dbError) {
            console.error('Database error when fetching user profile:', dbError);
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

// Update profile update handler to handle file uploads
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, phone, address, hobbies, birthdate, gender } = req.body;

        console.log('Updating profile for user:', userId);

        // Validate user ID
        const userIdValidation = validateUserId(userId);
        if (!userIdValidation.success) {
            console.error('Invalid user ID:', userIdValidation.message);
            return res.redirect('/user/profile?error=true');
        }

        // Validate file upload if present
        if (req.file) {
            const fileValidation = validateFileUpload(req.file, 'avatar');
            if (!fileValidation.success) {
                console.error('File validation failed:', fileValidation.message);
                return res.redirect('/user/profile?error=true&message=' + encodeURIComponent(fileValidation.message));
            }
        }

        // If there was an error with file upload, redirect with error message
        if (req.fileUploadError) {
            console.error('File upload error:', req.fileUploadError);
            return res.redirect('/user/profile?error=true&message=' + encodeURIComponent(req.fileUploadError));
        }

        // Prepare data for validation
        const inputData = {
            profile_id: userIdValidation.value,
            full_name: name,
            phone_number: phone,
            address: address,
            hobbies: hobbies,
            birthday: birthdate,
            gender: gender
        };

        // Add avatar URL if a file was uploaded
        if (req.filePath) {
            inputData.avatar_url = req.filePath;
        }

        // Validate all profile data
        const validation = validateUserProfileData(inputData);
        if (!validation.success) {
            console.error('Profile validation failed:', validation.message);
            return res.redirect('/user/profile?error=true&message=' + encodeURIComponent(validation.message));
        }

        console.log('Profile update data validated:', validation.data);

        // Update with validated data
        await updateUserInDB(validation.data);

        console.log('Profile update successful for user:', userId);

        // Redirect back to the profile page with a success message
        res.redirect('/user/profile?updated=true');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.redirect('/user/profile?error=true');
    }
};

// Update the middleware function to use the new path format
const handleAvatarUpload = (req, res, next) => {
    uploadAvatar(req, res, (err) => {
        // File upload was successful
        if (req.file) {
            // Update path to reference src/public/uploads
            req.filePath = `/uploads/profiles/${req.file.filename}`;
            console.log(`File uploaded successfully: ${req.filePath}`);
        }

        next();
    });
};

// Meme upload page handler
const getUploadMemePage = async (req, res) => {
    res.render('uploadMemePage');
};

// Process meme upload - VULNERABLE
const uploadMeme = async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).render('uploadMemePage', { error: 'No file uploaded' });
        }

        // VULNERABILITY: No server-side validation of file type beyond mimetype
        // VULNERABILITY: No sanitization of filename

        // Get the uploaded file path
        const filePath = req.filePath;

        console.log('Meme uploaded to:', filePath);

        // Return success with the file path
        return res.render('uploadMemePage', { success: true, filePath });
    } catch (error) {
        console.error('Meme upload error:', error);
        return res.status(500).render('uploadMemePage', { error: 'Server error during upload' });
    }
};

module.exports = {
    getHomePage,
    getAboutPage,
    getListUserPage,
    postEditUserById,
    handleAvatarUpload,
    getUploadMemePage,
    getAddUserPage,
    getLoginPage,
    postLogin,
    logout,
    getUserProfilePage,
    updateUserProfile,
    uploadMeme
};
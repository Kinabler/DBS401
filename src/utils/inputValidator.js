/**
 * Comprehensive input validation utility for user operations
 */

// Validation patterns
const patterns = {
    id: /^\d+$/, // Numeric IDs only
    name: /^[A-Za-z\s.,'-]{2,100}$/, // Names with basic punctuation, 2-100 chars
    username: /^[a-zA-Z0-9_]{3,20}$/, // Alphanumeric and underscore, 3-20 chars
    address: /^[A-Za-z0-9\s.,#'\-\/]{5,200}$/, // Address characters, 5-200 chars
    phone: /^[\d\+\-\(\)\s]{7,20}$/, // Phone number format, 7-20 chars
    hobbies: /^[A-Za-z0-9\s.,'\-]{0,500}$/, // Alphanumeric with punctuation, 0-500 chars
    gender: /^(male|female|other|prefer not to say|)$/i, // Expected gender values or empty
    avatarUrl: /^(\/uploads\/profiles\/[A-Za-z0-9\/_\-\.]+|)$/ // Valid avatar URL path format or empty
};

/**
 * Validates input based on specified pattern
 * @param {*} input - Input to validate
 * @param {RegExp} pattern - Regex pattern to validate against
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} - Validation result with success flag and message
 */
const validateField = (input, pattern, fieldName) => {
    // Handle undefined/null inputs
    if (input === undefined || input === null) {
        return { success: true, value: input };
    }

    // Convert to string and trim whitespace
    const stringValue = String(input).trim();

    // Empty strings are allowed for optional fields
    if (stringValue === '') {
        return { success: true, value: stringValue };
    }

    if (!pattern.test(stringValue)) {
        return {
            success: false,
            message: `Invalid ${fieldName} format`
        };
    }

    return { success: true, value: stringValue };
};

/**
 * Validates a date string or Date object
 * @param {string|Date} date - Date to validate
 * @param {string} fieldName - Name of field for error message
 * @returns {Object} - Validation result
 */
const validateDate = (date, fieldName) => {
    // Handle undefined/null dates
    if (date === undefined || date === null || date === '') {
        return { success: true, value: date };
    }

    // Try to parse the date
    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
        return {
            success: false,
            message: `Invalid ${fieldName} format`
        };
    }

    // Check if date is reasonable (not too far in past/future)
    const now = new Date();
    const minDate = new Date(1900, 0, 1);
    const maxDate = new Date(now.getFullYear() + 10, 11, 31);

    if (parsedDate < minDate || parsedDate > maxDate) {
        return {
            success: false,
            message: `${fieldName} must be between 1900 and ${now.getFullYear() + 10}`
        };
    }

    return { success: true, value: parsedDate };
};

/**
 * Validates user ID input
 * @param {string|number} id - User ID to validate
 * @returns {Object} - Validation result
 */
const validateUserId = (id) => {
    if (!id) {
        return { success: false, message: 'User ID is required' };
    }

    return validateField(id, patterns.id, 'user ID');
};

/**
 * Validates login credentials
 * @param {Object} credentials - Login credentials to validate
 * @returns {Object} - Validation result with sanitized data or error
 */
const validateLoginData = (credentials) => {
    const { username, password } = credentials;

    // Validate required fields
    if (!username || !password) {
        return { success: false, message: 'Username and password are required' };
    }

    // Validate username format
    const usernameValidation = validateField(username, patterns.username, 'username');
    if (!usernameValidation.success) {
        return { success: false, message: 'Invalid username or password' }; // Generic message for security
    }

    // Validate password length (minimum security requirement)
    if (password.length < 8 || password.length > 128) {
        return { success: false, message: 'Invalid username or password' }; // Generic message for security
    }

    return {
        success: true,
        data: {
            username: usernameValidation.value,
            password: password.trim()
        }
    };
};

/**
 * Validates user profile data
 * @param {Object} data - User profile data to validate
 * @returns {Object} - Validation result with sanitized data or error
 */
const validateUserProfileData = (data) => {
    const validationResults = {
        profile_id: validateUserId(data.profile_id),
        full_name: validateField(data.full_name, patterns.name, 'name'),
        address: validateField(data.address, patterns.address, 'address'),
        phone_number: validateField(data.phone_number, patterns.phone, 'phone number'),
        hobbies: validateField(data.hobbies, patterns.hobbies, 'hobbies'),
        birthday: validateDate(data.birthday, 'birthday'),
        gender: validateField(data.gender, patterns.gender, 'gender'),
        avatar_url: validateField(data.avatar_url, patterns.avatarUrl, 'avatar URL')
    };

    // Check for validation errors
    const errors = [];
    const sanitizedData = {};

    for (const [field, result] of Object.entries(validationResults)) {
        if (!result.success) {
            errors.push(result.message);
        } else if (result.value !== undefined) {
            sanitizedData[field] = result.value;
        }
    }

    if (errors.length > 0) {
        return {
            success: false,
            message: errors.join('; '),
            errors
        };
    }

    return {
        success: true,
        data: sanitizedData
    };
};

/**
 * Validates file upload data
 * @param {Object} file - File object from multer
 * @param {string} fileType - Type of file (e.g., 'avatar')
 * @returns {Object} - Validation result
 */
const validateFileUpload = (file, fileType = 'avatar') => {
    if (!file) {
        return { success: true, message: 'No file uploaded' };
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return {
            success: false,
            message: 'Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.'
        };
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        return {
            success: false,
            message: 'File size exceeds 5MB limit.'
        };
    }

    // Validate filename
    const filenamePattern = /^[A-Za-z0-9\._\-]+$/;
    if (!filenamePattern.test(file.filename)) {
        return {
            success: false,
            message: 'Invalid filename format.'
        };
    }

    return { success: true, data: file };
};

module.exports = {
    validateUserId,
    validateLoginData,
    validateUserProfileData,
    validateFileUpload,
    validateField,
    validateDate,
    patterns
};
const fs = require('fs');
const path = require('path');

// Function to ensure all required directories exist
const ensureDirectories = () => {
    const directories = [
        path.join(__dirname, '../public'),
        path.join(__dirname, '../public/css'),
        path.join(__dirname, '../public/uploads'),
        path.join(__dirname, '../public/uploads/profiles')
    ];

    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    });
};

module.exports = ensureDirectories;

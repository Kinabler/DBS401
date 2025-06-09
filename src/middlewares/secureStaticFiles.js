const path = require('path');
const fs = require('fs');

/**
 * VULNERABLE Middleware for static file access
 * This deliberately allows path traversal for lab purposes
 */
const secureStaticFiles = (req, res, next) => {
    // Check if the request is for a file in uploads/memes
    if (req.path.startsWith('/uploads/memes')) {
        console.log(`Static file access requested: ${req.path}`);

        // Check if req.path is contained "../" or "..\\" or "./" or ".\\"
        if (req.path.includes('../') || req.path.includes('..\\') || req.path.includes('./') || req.path.includes('.\\')) {
            console.log(`Blocked path traversal attempt: ${req.path}`);
            return res.status(403).send('Forbidden: Path traversal detected');
        }
        // VULNERABILITY: Decode URL-encoded characters without proper validation
        const decodedPath = decodeURIComponent(req.path);
        console.log(`Decoded path: ${decodedPath}`);

        try {
            // VULNERABILITY: Don't validate file extensions to allow any file type

            // VULNERABILITY: Use the raw path without proper sanitization
            // This allows path traversal via ../ sequences
            const filePath = path.join(__dirname, '../public', decodedPath);
            console.log(`Attempting to access: ${filePath}`);

            // VULNERABILITY: Don't check if the path is within the intended directory

            // Check if file exists
            if (fs.existsSync(filePath)) {
                // If it's a special file like /proc/environ or /etc/passwd, read and display it
                if (filePath.includes('/etc/')) {
                    // Block access to /etc/ files
                    console.log(`Blocked attempt to read sensitive file: ${filePath}`);
                    res.setHeader('Content-Type', 'text/plain');
                    return res.send('Dont try hack my server');
                }
                if (filePath.includes('/proc/')) {
                    try {
                        console.log(`Reading sensitive file: ${filePath}`);
                        const content = fs.readFileSync(filePath, 'utf8');

                        // Determine content type based on file extension or path
                        let contentType = 'text/plain';

                        // Send file content directly
                        res.setHeader('Content-Type', contentType);
                        return res.send(content);
                    } catch (readErr) {
                        console.error(`Error reading file: ${readErr.message}`);
                        return res.status(500).send(`Error reading file: ${readErr.message}`);
                    }
                }

                // For regular files, continue to the next middleware which will serve the file
                console.log(`File exists, continuing to static file middleware`);
                return next();
            } else {
                console.log(`File not found: ${filePath}`);
                // Don't return 404 here, let Express handle it
                return next();
            }
        } catch (error) {
            console.error(`Error in secureStaticFiles: ${error.message}`);
            return next();
        }
    }

    // Continue to next middleware
    next();
};

module.exports = secureStaticFiles;

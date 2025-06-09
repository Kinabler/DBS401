require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser'); // Add cookie-parser require
const configViewEngine = require('./configs/viewEngine');
const webRoute = require('./routes/web_router');
const ensureDirectories = require('./middlewares/ensureDirectories');
const secureStaticFiles = require('./middlewares/secureStaticFiles');

// Ensure all required directories exist
ensureDirectories();

const app = express();

// Config host, port
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 8081;

// Config view engine
configViewEngine(app, express);

// Apply secure static files middleware before serving static files
app.use(secureStaticFiles);

// VULNERABILITY: Don't use path.join for static files to allow path traversal
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, 'public'))); // Add this line to serve from src/public

// Express Json config
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Add cookie parser middleware

// Ensure logs directory exists
const logsDir = './src/logs';
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// init morgan logger
var accessLogStream = fs.createWriteStream('./src/logs/access.log', { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

// Init routes
app.use('/', webRoute);

// Handler Middleware 
// 404 Not Found: Must be placed after all routes
app.use((req, res) => {
    return res.status(404).render("404Page");
});

// 500 Internal Server Error handler must be placed after all routes but with the 4 parameters
app.use((err, req, res, next) => {
    console.error(err.stack);
    return res.status(500).render("500Page");
});

// Listening to the server
app.listen(port, host, () => {
    console.log(`Server is running at http://${host}:${port}`);
});
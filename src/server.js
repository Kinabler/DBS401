require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const configViewEngine = require('./config/viewEngine');
const webRoute = require('./routes/web_router');

const app = express();

// Config host, port
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 8081;

// Config view engine
configViewEngine(app, express);

// Express Json config
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Listening to the server
app.listen(port, host, () => {
    console.log(`Server is running at http://${host}:${port}`);
});
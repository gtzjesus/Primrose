/**
 * WEB SERVER CONNECTION &&
 * DATABASE CONNECTION (ATLAS-CLOUD-BASED)
 */

// IMPORTS
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');

/**
 * DATABASE MANIPULATION FOR OUR
 * PASSWORD INTEGRATION
 * @returns DATABASE COMPLETE ADDRESS
 */
const database = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

/**
 * MONGOOSE CONNECTION TO CLOUD DATABASE
 */
mongoose.connect(database).then(() => {
  // console.log(`Database connection SUCCESS`);
});

/**
 * PORT CONNECTION WITH WEB SERVER
 */
const port = process.env.PORT || 3000;
hostname = '0.0.0.0';

//4) START OF SERVER
const server = app.listen(port, hostname, () => {
  console.log(`App is running on port ${port}`);
});

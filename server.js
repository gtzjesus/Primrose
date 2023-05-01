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
  console.log(`Database connection SUCCESS`);
});

/**
 * PORT CONNECTION WITH WEB SERVER
 */
const port = process.env.PORT || 7000;
app.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});

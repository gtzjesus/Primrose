/**
 * IMPORTING DATA FROM FILE INTO DB
 */

// IMPORTS
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./../../models/productModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

dotenv.config({ path: './config.env' });

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
mongoose.connect(database).then(() => console.log('Success'));

/**
 * READ JSON FILE
 */
const products = JSON.parse(
  fs.readFileSync(`${__dirname}/products.json`, 'utf-8')
);

const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

/**
 * IMPORT DATA INTO DATABASE
 */
const importData = async () => {
  try {
    await Product.create(products);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews, { validateBeforeSave: false });

    console.log('Data Loaded');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

/**
 * DELETE ALL DATA FROM DATABASE
 */
const deleteData = async () => {
  try {
    await Product.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();

    console.log('Data Deleted');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

/**
 * COMMANDS FOR RUNNING SCRIPT
 * node ./dev-data/data/import-dev-data.js --import
 */
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

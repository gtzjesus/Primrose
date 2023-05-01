const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // CREATE TRANSPORTER
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // DEFINE EMAIL OPTIONS
  const mailOptions = {
    from: 'Jesus Gutierrez <gtz.jesus@outlook.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };
  // SEND EMAIL TO CLIENT
  await transporter.sendMail(mailOptions);
};

// EXPORT MODULE
module.exports = sendEmail;

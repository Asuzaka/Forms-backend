const nodemailer = require("nodemailer");

const mailSecure = process.env.MAIL_SECURE === "true";

async function sendEmail(options) {
  // Creating transporter
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: mailSecure,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  // Sending mail
  await transporter.sendMail({
    from: "Custom Forms co. <custom@custom.io>", // sender address
    to: options.email, // list of receivers
    subject: options.subject, // Subject line
    text: options.message, // plain text body
    html: readyHtml(options), // html
  });
}

function readyHtml(options) {
  return `<!DOCTYPE html>
         <html lang="en">

         <head>
         <meta charset="UTF-8">
         <meta name="viewport" content="width=device-width, initial-scale=1.0">
         <title>${options.subject}</title>
         <style>
         body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f9;
            margin: 0;
            padding: 0;
         }

         .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
            margin: 10px 0;
         }

         .header {
            background-color: #4CAF50;
            color: #ffffff;
            text-align: center;
            padding: 20px;
         }

         .header h1 {
            margin: 0;
            font-size: 24px;
         }

         .content {
            padding: 20px;
            text-align: center;
         }

         .content p {
            font-size: 16px;
            color: #333333;
         }

         .content a {
            text-decoration: none;
         }

         .button {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            font-size: 16px;
         }

         .footer {
            background-color: #f4f4f9;
            color: #888888;
            text-align: center;
            padding: 10px;
            font-size: 12px;
         }
         </style>
         </head>

         <body>
         <div class="container">
         <div class="header">
            <h1>${options.subject}</h1>
         </div>
         <div class="content">
            <p>Hello, ${options.name}</p>
            <p>We received a request to ${options.text}. Click the button below to proceed:</p>
            <a href="${options.url}" class="button">${options.text}</a>
            <p>If you did not request a ${options.text}, please ignore this email.</p>
         </div>
         <div class="footer">
            <p>&copy; 2025 Custom Forms Co. All rights reserved.</p>
         </div>
         </div>
         </body>

         </html>`;
}

module.exports = sendEmail;

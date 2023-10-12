import dotenv from 'dotenv'
dotenv.config();
import nodemailer from 'nodemailer'

export const mailer = async (receiver, subject, message, sender = 'fiona@powpr.co.uk') => {
  let transporter
  let mailOptions = {}

  transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.powpr.co.uk",
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAILER_USER,
      pass: process.env.MAILER_PASS
    }
  });

  mailOptions = {
    from: sender,
    to: receiver,
    subject: subject,
    html: message
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.log('Email not sent: ' + error)
  })
}

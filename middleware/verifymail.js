import nodemailer from 'nodemailer'

export const mailer = async (receiver, message) => {
  let transporter
  let mailOptions = {}

  transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: 'idowudanielayotunde@gmail.com',
      pass: 'niosgwhnsfgoaije'
    }
  });

  mailOptions = {
    from: "idowudanielayotunde@gmail.com",
    to: receiver,
    subject: 'Verify email',
    html: message
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.log('Email not sent: ' + error)
  })
}

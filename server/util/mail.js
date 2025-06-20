import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: "Gmail", 
  auth: {
    user: process.env.ADMIN_NAME,
    pass: process.env.ADMIN_PASSWORD,
  },
});

export default async function sendMail({ email, subject, message }) {
  await transporter.sendMail({
    from: `Eventhon <${process.env.ADMIN_NAME}>`,
    to: email,
    subject,
    text: message,
  });
}

import nodemailer from 'nodemailer';

export const sendEmail = async ({ from, to, subject, html }) => {
  const port = Number(process.env.SMTP_PORT);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
};

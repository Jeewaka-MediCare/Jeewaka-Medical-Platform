import nodemailer from 'nodemailer';
import { registrationEmail } from './templates/registrationEmail.js';

// Create transporter (Gmail example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'trinith.22@cse.mrt.ac.lk',        // your email
    pass: 'qsesnpzfbavptfvf'           // app password (not your normal Gmail password)
  }
});

// Reusable function to send emails
export async function sendRegistrationEmail(to, name, role) {
  try {
    const subject = `🎉 Welcome ${name}! Your ${role} Account is Ready`;
    const html = registrationEmail(name, role);

    const mailOptions = {
      from: '"HealthCare Platform" <trinith.22@cse.mrt.ac.lk>',
      to,
      subject,
      text: `Hi ${name}, your registration as a ${role} was successful!`,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.response);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

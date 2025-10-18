import nodemailer from 'nodemailer';
import { registrationEmail } from './templates/registrationEmail.js';
import { doctorVerificationEmail } from './templates/adminVerificationEmail.js';


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

/**
 * Send a “doctor verification result” email
 * @param {Object} opts
 * @param {string} opts.to - Recipient e-mail address
 * @param {string} opts.doctorName - Full name of the doctor
 * @param {boolean} opts.isVerified - true = approved, false = rejected
 * @param {string} [opts.adminComments] - Optional reviewer comments
 * @param {string} [opts.dashboardUrl] - Link shown when approved
 * @param {string} [opts.resubmitUrl]  - Link shown when rejected
 * @returns {Promise<import("nodemailer").SentMessageInfo>}
 */
export async function sendDoctorVerificationEmail({
  
  doctorName,
  
  to,
  isVerified,
  adminComments = "",
  dashboardUrl = "#",
  resubmitUrl = "#",
}) {
  try {
    const subject = isVerified
      ? `✅ Verification approved – welcome aboard, ${doctorName}!`
      : `⚠️ Verification not approved – action required`;

    const html = doctorVerificationEmail({
      doctorName,
      isVerified,
      adminComments,
      dashboardUrl,
      resubmitUrl,
    });

    const text = isVerified
      ? `Great news, ${doctorName}! Your profile has been verified. You can now accept appointments.`
      : `Hello ${doctorName}, unfortunately we couldn't verify your profile this time. Please review the notes and resubmit.`;

    const mailOptions = {
      from: '"HealthCare Platform" <trinith.22@cse.mrt.ac.lk>',
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Verification email sent:", info.response);
    return info;
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    throw error;
  }
}


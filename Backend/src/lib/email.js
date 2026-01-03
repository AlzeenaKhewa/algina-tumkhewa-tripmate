// src/lib/email.js
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';


dotenv.config();
// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
console.log('Email transporter configured with user:', process.env.EMAIL_USER);

/**
 * Send email with HTML template
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @returns {Promise<object>} - Nodemailer response
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"Tripmate" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Send verification OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {number} expiresIn - Expiry time in minutes
 */
export const sendVerificationEmail = async (email, otp, expiresIn = 15) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; }
          .otp-box { background-color: #f0f0f0; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 5px; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Tripmate!</h1>
          </div>
          <div class="content">
            <p>Hi,</p>
            <p>Thank you for signing up. Please verify your email address using the code below:</p>
            <div class="otp-box">
              <p class="otp-code">${otp}</p>
            </div>
            <p><strong>This code expires in ${expiresIn} minutes.</strong></p>
            <p>If you didn't sign up for this account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Tripmate. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email - Tripmate',
    html,
    text: `Your Tripmate verification code is: ${otp}. This code expires in ${expiresIn} minutes.`,
  });
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} otp - Password reset OTP
 * @param {number} expiresIn - Expiry time in minutes
 */
export const sendPasswordResetEmail = async (email, otp, expiresIn = 30) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; }
          .otp-box { background-color: #f0f0f0; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #ef4444; letter-spacing: 5px; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi,</p>
            <p>We received a request to reset your password. Use the code below to proceed:</p>
            <div class="otp-box">
              <p class="otp-code">${otp}</p>
            </div>
            <p><strong>This code expires in ${expiresIn} minutes.</strong></p>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Tripmate. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset Request - Tripmate',
    html,
    text: `Your password reset code is: ${otp}. This code expires in ${expiresIn} minutes.`,
  });
};

/**
 * Send welcome email after successful registration
 * @param {string} email - Recipient email
 * @param {string} firstName - User's first name
 */
export const sendWelcomeEmail = async (email, firstName) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Tripmate!</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>Your email has been verified successfully! You're now ready to explore and share your travel experiences with Tripmate.</p>
            <p>Get started by completing your profile and discovering amazing destinations.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Tripmate. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Tripmate!',
    html,
    text: `Welcome to Tripmate, ${firstName}! Your account is now active.`,
  });
};

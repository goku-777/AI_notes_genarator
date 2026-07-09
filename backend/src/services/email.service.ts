import nodemailer from 'nodemailer';
import { config } from '../config/env';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<void> => {
  await transporter.sendMail({
    from: config.smtp.emailFrom,
    to,
    subject,
    html,
  });
};

export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  resetUrl: string
): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background:#ffffff; border-radius:16px; border:1px solid #eee;">
      <h2 style="color:#1E1E1E;">Reset your password</h2>
      <p style="color:#444;">Hi ${name},</p>
      <p style="color:#444;">We received a request to reset the password for your AI Notes Generator account. Click the button below to choose a new password. This link expires in 30 minutes.</p>
      <a href="${resetUrl}" style="display:inline-block; margin-top:16px; padding:12px 24px; background:#4F46E5; color:#fff; text-decoration:none; border-radius:10px; font-weight:600;">Reset Password</a>
      <p style="color:#888; font-size:13px; margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  await sendEmail({
    to,
    subject: 'Reset your AI Notes Generator password',
    html,
  });
};

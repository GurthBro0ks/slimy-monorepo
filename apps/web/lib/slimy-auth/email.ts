/**
 * Slimy Auth — Email sending via local Postfix + nodemailer
 */

import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "127.0.0.1";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "25", 10);
const FROM_ADDRESS = process.env.SMTP_FROM || "noreply@slimyai.xyz";

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  tls: { rejectUnauthorized: false },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email via local Postfix.
 */
export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: `"SlimyAI" <${FROM_ADDRESS}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text || opts.html.replace(/<[^>]*>/g, ""),
    });
    console.log(`[SlimyAuth:Email] Sent to ${opts.to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[SlimyAuth:Email] Failed to send to ${opts.to}:`, error);
    return false;
  }
}

/**
 * HTML template for email verification
 */
export function verificationEmailHtml(username: string, verifyUrl: string): string {
  return `
    <div style="font-family: monospace; max-width: 500px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #00ff00; border: 1px solid #00ff00;">
      <h2 style="color: #d400ff;">Welcome to SlimyAI, ${username}!</h2>
      <p>Click the link below to verify your email:</p>
      <p><a href="${verifyUrl}" style="color: #00ff00; font-weight: bold;">${verifyUrl}</a></p>
      <p style="color: #888; font-size: 12px;">Expires in 24 hours. Didn't register? Ignore this.</p>
    </div>
  `;
}

/**
 * HTML template for password reset
 */
export function passwordResetEmailHtml(username: string, resetUrl: string): string {
  return `
    <div style="font-family: monospace; max-width: 500px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #00ff00; border: 1px solid #00ff00;">
      <h2 style="color: #d400ff;">Password Reset — SlimyAI</h2>
      <p>Hi ${username}, a password reset was requested.</p>
      <p><a href="${resetUrl}" style="color: #00ff00; font-weight: bold;">Reset your password</a></p>
      <p style="color: #888; font-size: 12px;">Expires in 1 hour. Didn't request this? Ignore it.</p>
    </div>
  `;
}

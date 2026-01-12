/**
 * Email Service
 * 
 * Handles sending transactional emails for the PARAM system.
 * Uses nodemailer with SMTP configuration.
 * 
 * In production, consider using services like:
 * - SendGrid
 * - AWS SES
 * - Resend
 * - Postmark
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("email-service");

// Email transporter (lazy initialized)
let transporter: Transporter | null = null;

/**
 * Get or create the email transporter
 */
function getTransporter(): Transporter | null {
  if (transporter) {
    return transporter;
  }

  // Check if email is configured
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn("Email not configured - SMTP_HOST, SMTP_USER, or SMTP_PASS missing");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

/**
 * Send an email
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    logger.warn({ to: options.to, subject: options.subject }, "Email not sent - not configured");
    return false;
  }

  try {
    const result = await transport.sendMail({
      from: env.EMAIL_FROM || `"PARAM" <noreply@param.edu>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
    });

    logger.info({ messageId: result.messageId, to: options.to }, "Email sent successfully");
    return true;
  } catch (error) {
    logger.error({ error, to: options.to, subject: options.subject }, "Failed to send email");
    return false;
  }
}

// ===========================================
// ACTIVATION EMAILS
// ===========================================

/**
 * Send student account activation email
 */
export async function sendActivationEmail(params: {
  to: string;
  name: string;
  enrollmentNumber: string;
  activationLink: string;
}): Promise<boolean> {
  const { to, name, enrollmentNumber, activationLink } = params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activate Your PARAM Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">PARAM</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Academic Credential System</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">Welcome, ${name}!</h2>
              
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your student account has been created in the PARAM Academic Credential System. 
                Click the button below to activate your account and set up your secure blockchain wallet.
              </p>
              
              <!-- Student Info Box -->
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 0 0 30px;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Your Details</p>
                <p style="margin: 0 0 4px; color: #1f2937; font-size: 16px;"><strong>Name:</strong> ${name}</p>
                <p style="margin: 0; color: #1f2937; font-size: 16px;"><strong>Enrollment Number:</strong> ${enrollmentNumber}</p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${activationLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                  Activate My Account
                </a>
              </div>
              
              <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; text-align: center;">
                This link will expire in <strong>7 days</strong>.
              </p>
              
              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <!-- What Happens Next -->
              <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 18px;">What happens when you activate?</h3>
              <ul style="margin: 0; padding: 0 0 0 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                <li>You'll log in using your institutional email</li>
                <li>A secure blockchain wallet will be automatically created for you</li>
                <li>You can start viewing your academic credentials</li>
                <li>All your semester transcripts and degree certificates will be issued as NFTs</li>
              </ul>
              
              <!-- Fallback Link -->
              <p style="margin: 30px 0 0; color: #9ca3af; font-size: 12px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${activationLink}" style="color: #3b82f6; word-break: break-all;">${activationLink}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
                This email was sent by the PARAM Academic Credential System.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                If you didn't expect this email, please contact your institution's academic office.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return sendEmail({
    to,
    subject: "🎓 Activate Your PARAM Account",
    html,
  });
}

/**
 * Send activation reminder email
 */
export async function sendActivationReminderEmail(params: {
  to: string;
  name: string;
  enrollmentNumber: string;
  activationLink: string;
  daysRemaining: number;
}): Promise<boolean> {
  const { to, name, enrollmentNumber, activationLink, daysRemaining } = params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reminder: Activate Your PARAM Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <h2 style="margin: 0 0 20px; color: #f59e0b;">⏰ Reminder</h2>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px;">
                Hi ${name}, your PARAM account activation link expires in <strong>${daysRemaining} day${daysRemaining > 1 ? "s" : ""}</strong>.
              </p>
              <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">
                Enrollment: ${enrollmentNumber}
              </p>
              <a href="${activationLink}" style="display: inline-block; padding: 14px 32px; background-color: #f59e0b; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                Activate Now
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return sendEmail({
    to,
    subject: `⏰ Reminder: Activate Your PARAM Account (${daysRemaining} day${daysRemaining > 1 ? "s" : ""} left)`,
    html,
  });
}

// ===========================================
// CREDENTIAL EMAILS
// ===========================================

/**
 * Send credential issued notification
 */
export async function sendCredentialIssuedEmail(params: {
  to: string;
  name: string;
  credentialType: "semester" | "degree" | "certificate";
  title: string;
  viewLink: string;
}): Promise<boolean> {
  const { to, name, credentialType, title, viewLink } = params;

  const typeLabel = {
    semester: "Semester Report",
    degree: "Degree Certificate",
    certificate: "Certificate",
  }[credentialType];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Credential Issued</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <h2 style="margin: 0 0 10px; color: #10b981;">🎉 New Credential Issued!</h2>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px;">
                Hi ${name}, your ${typeLabel} has been issued as a blockchain credential.
              </p>
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">${title}</p>
              </div>
              <a href="${viewLink}" style="display: inline-block; padding: 14px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                View Credential
              </a>
              <p style="margin: 20px 0 0; color: #9ca3af; font-size: 13px;">
                This credential is permanently stored on the blockchain and can be verified by anyone.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return sendEmail({
    to,
    subject: `🎉 Your ${typeLabel} Has Been Issued - PARAM`,
    html,
  });
}

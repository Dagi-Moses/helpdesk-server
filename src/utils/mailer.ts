import nodemailer from "nodemailer";
import { logger } from "@/utils/logger";
import { AppError } from "./apiResponse";

const transporter = nodemailer.createTransport({
    service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Bypass strict SSL checking
        minVersion: "TLSv1.2",
      },
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT) || 587,
//   secure: process.env.SMTP_SECURE === "true",
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
});

transporter.verify((error) => {
  if (error) {
    logger.error("SMTP verification failed", {
      message: error.message,
      stack: error.stack,
    });
  } else {
    logger.info("SMTP server is ready to accept messages");
  }
});

export async function sendMail(to: string, subject: string, html: string) {


  try {
     
logger.info(`Sending email to ${to} with subject "${subject}"`);
    const result = await transporter.sendMail({
  
       from:    process.env.MAIL_FROM || "Qrynex Helpdesk <no-reply@qrynex.com>",
      to: to.trim(),
     
      subject,
      html,
    });
logger.info(`Email sent to ${to} with subject "${subject}"`, {
  messageId: result.messageId,
  response: result.response,
  accepted: result.accepted,
  rejected: result.rejected,
  envelope: result.envelope,
});
    
return result;
  } catch (err:any) {
    
    logger.error(`Failed to send email to ${to}`, err);
    throw new AppError(
      "Failed to send email. Please try again later.",
      500,
      undefined,
      "EMAIL_SEND_FAILED"
    );

    // //throw err;
    //   throw new AppError("Failed to send email. Please try again later.", 500);
  }
}

export function verificationEmail(firstName: string, verifyUrl: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your Qrynex Helpdesk account</title>
</head>

<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="max-width:560px;margin:40px auto;padding:0 20px;">
    
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:32px;">
      
      <h1 style="margin:0 0 24px;font-size:22px;font-weight:600;color:#111827;">
        Verify your email address
      </h1>

      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        Hi ${firstName},
      </p>

      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
        Thanks for creating your Qrynex IT Helpdesk account.
        Please verify your email address to activate your account.
      </p>

      <a
        href="${verifyUrl}"
        style="
          display:inline-block;
          padding:12px 20px;
          background:#2451B3;
          color:#ffffff;
          text-decoration:none;
          border-radius:6px;
          font-size:14px;
          font-weight:600;
        "
      >
        Verify email address
      </a>

      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">
        This verification link expires in 24 hours.
      </p>

      <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">
        If you didn't create this account, you can safely ignore this email.
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />

      <p style="margin:0;font-size:12px;color:#9ca3af;">
        Qrynex IT Helpdesk
      </p>

    </div>
  </div>
</body>
</html>
`;
}

export function resetPasswordEmail(firstName: string, resetUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Reset your password</h2>
      <p>Hi ${firstName},</p>
      <p>We received a request to reset your password. Click below to choose a new one:</p>
      <p>
        <a href="${resetUrl}" style="background:#2451B3;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
          Reset password
        </a>
      </p>
      <p style="color:#666;font-size:13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.</p>
    </div>`;
}

export function ticketAssignedEmail(agentName: string, ticketTitle: string, ticketUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Ticket assigned to you</h2>
      <p>Hi ${agentName},</p>
      <p>You've been assigned: <strong>${ticketTitle}</strong></p>
      <p><a href="${ticketUrl}" style="background:#2451B3;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">View ticket</a></p>
    </div>`;
}

export function ticketCommentEmail(recipientName: string, commenterName: string, ticketTitle: string, ticketUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>New comment on your ticket</h2>
      <p>Hi ${recipientName},</p>
      <p>${commenterName} commented on: <strong>${ticketTitle}</strong></p>
      <p><a href="${ticketUrl}" style="background:#2451B3;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">View ticket</a></p>
    </div>`;
}

export function ticketResolvedEmail(employeeName: string, ticketTitle: string, ticketUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Your ticket has been resolved</h2>
      <p>Hi ${employeeName},</p>
      <p><strong>${ticketTitle}</strong> has been marked as resolved. If the issue isn't actually fixed, reopen it from the ticket page.</p>
      <p><a href="${ticketUrl}" style="background:#0F9E8E;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">View ticket</a></p>
    </div>`;
}
import nodemailer from 'nodemailer';
import { env } from '../config/env';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }

  async sendVerificationEmail(email: string, verificationLink: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Verify your Down Together account</h2>
          <p>Welcome to Down Together! Please verify your email address to get started.</p>
          <p>
            <a href="${verificationLink}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p>Or copy this link: ${verificationLink}</p>
          <p>This link expires in 24 hours.</p>
          <p>Best regards,<br>Down Together Team</p>
        </body>
      </html>
    `;

    return this.transporter.sendMail({
      from: env.senderEmail,
      to: email,
      subject: 'Verify your Down Together account',
      html,
    });
  }

  async sendCommentApprovedEmail(email: string, articleTitle: string, articleUrl: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Your comment was approved!</h2>
          <p>Great news! Your comment on "${articleTitle}" has been approved and is now visible to the community.</p>
          <p>
            <a href="${articleUrl}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Article
            </a>
          </p>
          <p>Thank you for being part of our community!</p>
          <p>Best regards,<br>Down Together Team</p>
        </body>
      </html>
    `;

    return this.transporter.sendMail({
      from: env.senderEmail,
      to: email,
      subject: 'Your comment was approved',
      html,
    });
  }

  async sendCommentReplyEmail(email: string, replyText: string, articleUrl: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>You have a new reply</h2>
          <p>Someone replied to your comment:</p>
          <blockquote style="border-left: 4px solid #2563EB; padding-left: 15px; margin-left: 0;">
            "${replyText.substring(0, 200)}${replyText.length > 200 ? '...' : ''}"
          </blockquote>
          <p>
            <a href="${articleUrl}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Read Reply
            </a>
          </p>
          <p>Best regards,<br>Down Together Team</p>
        </body>
      </html>
    `;

    return this.transporter.sendMail({
      from: env.senderEmail,
      to: email,
      subject: 'New reply to your comment',
      html,
    });
  }

  async sendExpertVerifiedEmail(email: string, name: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Welcome, Expert! 🎉</h2>
          <p>Hi ${name},</p>
          <p>Your expert verification has been approved! You can now:</p>
          <ul>
            <li>Submit expert Q&A answers</li>
            <li>Display your verified badge</li>
            <li>Help the community with trusted advice</li>
          </ul>
          <p>Thank you for sharing your expertise with Down Together!</p>
          <p>Best regards,<br>Down Together Team</p>
        </body>
      </html>
    `;

    return this.transporter.sendMail({
      from: env.senderEmail,
      to: email,
      subject: 'Your expert verification is approved!',
      html,
    });
  }

  async sendWeeklyNewsletter(email: string, articlesHtml: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Down Together Weekly Digest</h2>
          <p>Hi,</p>
          <p>Here are the top articles from this week:</p>
          ${articlesHtml}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p>
            <a href="https://downtogether.org" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Visit Down Together
            </a>
          </p>
          <p>
            <small>
              <a href="https://downtogether.org/unsubscribe" style="color: #666; text-decoration: none;">
                Unsubscribe
              </a>
            </small>
          </p>
        </body>
      </html>
    `;

    return this.transporter.sendMail({
      from: env.senderEmail,
      to: email,
      subject: 'Down Together Weekly - Top Articles',
      html,
    });
  }

  async sendNewsletterConfirmationEmail(email: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Welcome to Down Together Newsletter!</h2>
          <p>Thank you for subscribing!</p>
          <p>You'll now receive our weekly digest with the best articles, expert Q&A, and community highlights.</p>
          <p>
            <a href="https://downtogether.org" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Explore Down Together
            </a>
          </p>
          <p>Best regards,<br>Down Together Team</p>
        </body>
      </html>
    `;

    return this.transporter.sendMail({
      from: env.senderEmail,
      to: email,
      subject: 'Welcome to Down Together Newsletter',
      html,
    });
  }

  async sendRejectionEmail(email: string, type: string, reason?: string) {
    let subject = '';
    let message = '';

    if (type === 'expert') {
      subject = 'Expert Verification Update';
      message = `
        <h2>Expert Verification Update</h2>
        <p>Thank you for your interest in becoming a verified expert on Down Together.</p>
        <p>Unfortunately, your application was not approved at this time.</p>
        ${reason ? `<p><strong>Feedback:</strong> ${reason}</p>` : ''}
        <p>You're welcome to reapply with additional credentials or clarification.</p>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          ${message}
          <p>If you have questions, please contact our team.</p>
          <p>Best regards,<br>Down Together Team</p>
        </body>
      </html>
    `;

    return this.transporter.sendMail({
      from: env.senderEmail,
      to: email,
      subject,
      html,
    });
  }
}

export const emailService = new EmailService();

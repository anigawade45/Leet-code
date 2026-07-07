import { Resend } from 'resend';
import { logger } from '@/lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

export const EmailService = {
  async sendVerificationEmail(email, token) {
    const verificationUrl = `${BASE_URL}/verify?token=${token}`;

    try {
      const data = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Verify your LeetCode Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Welcome to LeetCode!</h2>
            <p style="color: #555; font-size: 16px;">
              Please verify your email address to complete your registration.
            </p>
            <div style="margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #0F172A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Verify Email
              </a>
            </div>
            <p style="color: #888; font-size: 14px;">
              If you didn't create an account, you can safely ignore this email.
            </p>
            <p style="color: #888; font-size: 12px; margin-top: 40px;">
              Verification Link: <a href="${verificationUrl}">${verificationUrl}</a>
            </p>
          </div>
        `,
      });

      logger.info({ email, event: 'EMAIL_VERIFICATION_SENT' }, 'Verification email sent');
      return { success: true, data };
    } catch (error) {
      logger.error({ email, error: error.message, event: 'EMAIL_VERIFICATION_FAILED' }, 'Failed to send verification email');
      throw new Error('Failed to send verification email');
    }
  },
};

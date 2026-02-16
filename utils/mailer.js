import Nodemailer from 'nodemailer';
import { MailtrapTransport } from 'mailtrap';
import dotenv from 'dotenv';

dotenv.config();

const TOKEN = process.env.MAILTRAP_API_TOKEN;

const transport = Nodemailer.createTransport(
    MailtrapTransport({
        token: TOKEN,
    })
);

const sender = {
    address: 'hello@kavana.my.id',
    name: 'KavanaHub',
};

/**
 * Send OTP verification email
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @param {string} type - 'reset_password' or 'login'
 * @returns {Promise}
 */
export async function sendOTPEmail(to, otp, type = 'reset_password') {
    const subject = type === 'reset_password'
        ? 'Reset Password - KavanaHub'
        : 'Kode Verifikasi Login - KavanaHub';

    const heading = type === 'reset_password'
        ? 'Reset Password'
        : 'Verifikasi Login';

    const description = type === 'reset_password'
        ? 'Anda meminta untuk mereset password akun Anda.'
        : 'Masukkan kode di bawah ini untuk melanjutkan login.';

    return transport.sendMail({
        from: sender,
        to: [to],
        subject,
        html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #1e1e2e; color: #cdd6f4; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #b4befe; font-size: 24px; margin: 0;">KavanaHub</h1>
          <p style="color: #a6adc8; font-size: 13px; margin: 4px 0 0;">Sistem Bimbingan Online</p>
        </div>
        <div style="background: #313244; border-radius: 12px; padding: 24px; text-align: center;">
          <h2 style="color: #cdd6f4; font-size: 18px; margin: 0 0 8px;">${heading}</h2>
          <p style="color: #a6adc8; font-size: 14px; margin: 0 0 20px;">${description}</p>
          <div style="background: #45475a; border-radius: 8px; padding: 16px; margin: 0 auto; display: inline-block;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #b4befe;">${otp}</span>
          </div>
          <p style="color: #a6adc8; font-size: 12px; margin: 16px 0 0;">Kode berlaku selama <strong style="color: #fab387;">5 menit</strong></p>
        </div>
        <p style="color: #6c7086; font-size: 11px; text-align: center; margin: 20px 0 0;">
          Jika Anda tidak meminta kode ini, abaikan email ini.<br/>
          &copy; ${new Date().getFullYear()} KavanaHub
        </p>
      </div>
    `,
        category: 'OTP',
    });
}

export default transport;

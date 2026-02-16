import pool from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { sendOTPEmail } from '../utils/mailer.js';

// OTP config
const OTP_EXPIRY_MINUTES = 5;
const OTP_RATE_LIMIT = 3; // max requests per window
const OTP_RATE_WINDOW_MINUTES = 10;
const RESET_TOKEN_EXPIRY = '10m';

/**
 * Generate a random 6-digit OTP
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Ensure otp_codes table exists (auto-create)
 */
async function ensureOTPTable() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp_hash VARCHAR(255) NOT NULL,
      type ENUM('login', 'reset_password') DEFAULT 'reset_password',
      expires_at DATETIME NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      attempts INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email_type (email, type),
      INDEX idx_expires (expires_at)
    )
  `);
}

const otpController = {
    /**
     * POST /api/auth/request-otp
     * Body: { email, type? }
     * Generates OTP, sends via Mailtrap, stores hashed in DB
     */
    requestOTP: async (req, res, next) => {
        const { email, type = 'reset_password' } = req.body;

        try {
            // Validate input
            if (!email) {
                return res.status(400).json({ message: 'Email wajib diisi' });
            }

            // Check if user exists (check mahasiswa first, then dosen)
            let userExists = false;
            let [rows] = await pool.query('SELECT id FROM mahasiswa WHERE email = ?', [email]);
            if (rows.length > 0) {
                userExists = true;
            } else {
                [rows] = await pool.query('SELECT id FROM dosen WHERE email = ?', [email]);
                if (rows.length > 0) {
                    userExists = true;
                }
            }

            if (!userExists) {
                return res.status(404).json({ message: 'Email tidak terdaftar' });
            }

            // Ensure table exists
            await ensureOTPTable();

            // Rate limiting: check how many OTPs sent in the last window
            const [recentOTPs] = await pool.query(
                `SELECT COUNT(*) as count FROM otp_codes 
         WHERE email = ? AND type = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
                [email, type, OTP_RATE_WINDOW_MINUTES]
            );

            if (recentOTPs[0].count >= OTP_RATE_LIMIT) {
                return res.status(429).json({
                    message: `Terlalu banyak permintaan OTP. Coba lagi dalam ${OTP_RATE_WINDOW_MINUTES} menit.`,
                });
            }

            // Invalidate previous unused OTPs for this email
            await pool.query(
                'UPDATE otp_codes SET used = TRUE WHERE email = ? AND type = ? AND used = FALSE',
                [email, type]
            );

            // Generate & hash OTP
            const otp = generateOTP();
            const otpHash = await hashPassword(otp);
            const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

            // Store in DB
            await pool.query(
                'INSERT INTO otp_codes (email, otp_hash, type, expires_at) VALUES (?, ?, ?, ?)',
                [email, otpHash, type, expiresAt]
            );

            // Send OTP email via Mailtrap
            await sendOTPEmail(email, otp, type);

            res.json({
                message: 'Kode OTP telah dikirim ke email Anda',
                expires_in: OTP_EXPIRY_MINUTES * 60, // seconds
            });
        } catch (err) {
            console.error('Request OTP error:', err);
            next(err);
        }
    },

    /**
     * POST /api/auth/verify-otp
     * Body: { email, otp, type? }
     * Verifies OTP and returns a temporary reset token
     */
    verifyOTP: async (req, res, next) => {
        const { email, otp, type = 'reset_password' } = req.body;

        try {
            // Validate input
            if (!email || !otp) {
                return res.status(400).json({ message: 'Email dan kode OTP wajib diisi' });
            }

            await ensureOTPTable();

            // Find latest unused OTP for this email
            const [rows] = await pool.query(
                `SELECT id, otp_hash, expires_at, attempts FROM otp_codes 
         WHERE email = ? AND type = ? AND used = FALSE 
         ORDER BY created_at DESC LIMIT 1`,
                [email, type]
            );

            if (rows.length === 0) {
                return res.status(400).json({ message: 'Kode OTP tidak ditemukan. Silakan minta kode baru.' });
            }

            const otpRecord = rows[0];

            // Check if expired
            if (new Date() > new Date(otpRecord.expires_at)) {
                await pool.query('UPDATE otp_codes SET used = TRUE WHERE id = ?', [otpRecord.id]);
                return res.status(400).json({ message: 'Kode OTP sudah kedaluwarsa. Silakan minta kode baru.' });
            }

            // Check max attempts (prevent brute force)
            if (otpRecord.attempts >= 5) {
                await pool.query('UPDATE otp_codes SET used = TRUE WHERE id = ?', [otpRecord.id]);
                return res.status(400).json({ message: 'Terlalu banyak percobaan. Silakan minta kode baru.' });
            }

            // Increment attempt counter
            await pool.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [otpRecord.id]);

            // Verify OTP
            const isMatch = await comparePassword(otp, otpRecord.otp_hash);
            if (!isMatch) {
                const remaining = 5 - (otpRecord.attempts + 1);
                return res.status(400).json({
                    message: `Kode OTP salah. ${remaining > 0 ? `Sisa percobaan: ${remaining}` : 'Silakan minta kode baru.'}`,
                });
            }

            // Mark OTP as used
            await pool.query('UPDATE otp_codes SET used = TRUE WHERE id = ?', [otpRecord.id]);

            // Generate temporary token for password reset
            const resetToken = generateToken(
                { email, purpose: 'reset_password' },
            );

            res.json({
                message: 'Kode OTP berhasil diverifikasi',
                reset_token: resetToken,
            });
        } catch (err) {
            console.error('Verify OTP error:', err);
            next(err);
        }
    },

    /**
     * POST /api/auth/reset-password
     * Body: { reset_token, new_password }
     * Resets user password using the temporary token
     */
    resetPassword: async (req, res, next) => {
        const { reset_token, new_password } = req.body;

        try {
            // Validate input
            if (!reset_token || !new_password) {
                return res.status(400).json({ message: 'Token dan password baru wajib diisi' });
            }

            if (new_password.length < 6) {
                return res.status(400).json({ message: 'Password minimal 6 karakter' });
            }

            // Verify reset token
            let payload;
            try {
                const jwt = await import('jsonwebtoken');
                payload = jwt.default.verify(reset_token, process.env.JWT_SECRET);
            } catch (err) {
                return res.status(400).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
            }

            if (payload.purpose !== 'reset_password') {
                return res.status(400).json({ message: 'Token tidak valid' });
            }

            const email = payload.email;
            const newHash = await hashPassword(new_password);

            // Try to update mahasiswa first
            let [result] = await pool.query(
                'UPDATE mahasiswa SET password_hash = ? WHERE email = ?',
                [newHash, email]
            );

            // If not mahasiswa, try dosen
            if (result.affectedRows === 0) {
                [result] = await pool.query(
                    'UPDATE dosen SET password_hash = ? WHERE email = ?',
                    [newHash, email]
                );
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Akun tidak ditemukan' });
            }

            // Clean up all OTPs for this email
            await pool.query('DELETE FROM otp_codes WHERE email = ?', [email]);

            res.json({ message: 'Password berhasil direset. Silakan login dengan password baru.' });
        } catch (err) {
            console.error('Reset password error:', err);
            next(err);
        }
    },
};

export default otpController;

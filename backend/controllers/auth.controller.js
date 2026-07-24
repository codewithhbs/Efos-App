const bcrypt = require("bcrypt");
const getPool = require("../config/db");
const { signToken, signRefreshToken, verifyToken } = require("../utils/jwt");
const { sendEmail, sanitizeRecipient } = require("../utils/sendEmail");
const pool = getPool();
const generateOTP = () => Math.floor(1000 + Math.random() * 9999).toString(); //4 digit otp
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const sendDltOtp = require("../utils/sendDltOtp");
const { sendNotification } = require("../utils/sendNotifications");

// Ensure resume directory exists
const resumeDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(resumeDir)) {
    fs.mkdirSync(resumeDir, { recursive: true });
}

const ACCESS_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
};

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Accept registration_number OR phone OR email as the login identifier.
const findUserByIdentifier = async (identifier) => {
    const id = String(identifier).trim();

    const [[user]] = await pool.query(
        `SELECT
            u.*,
            s.registration_number
         FROM users u
         LEFT JOIN students s ON s.user_id = u.id
         WHERE s.registration_number = ?
            OR u.phone = ?
            OR u.email = ?
         LIMIT 1`,
        [id, id, id.toLowerCase()]
    );

    return user || null;
};

const toMobile = (phone) => {
    const localDigits = String(phone || "").replace(/\D/g, "").slice(-10);
    return `91${localDigits}`;
};

const issueSession = async (req, res, user, fcm_token = null) => {
    const accessToken = signToken({ id: user.id, email: user.email });
    const refreshToken = signRefreshToken({ id: user.id });
    console.log("fcm_token", fcm_token)
    const device = req.headers["user-agent"] || "Unknown";
    const ip =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        req.ip;

    if (fcm_token) {
        await pool.query(
            "UPDATE users SET fcm_token = ? WHERE id = ?",
            [fcm_token, user.id]
        );
    }

    await pool.query(
        `INSERT INTO user_tokens
        (user_id, refresh_token, device, user_agent, ip_address, expires_at)
        VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [user.id, refreshToken, device, device, ip]
    );

    res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

    const safeUser = { ...user };
    delete safeUser.password;
    delete safeUser.new_password;
    delete safeUser.login_otp;
    delete safeUser.login_otp_expiry;
    delete safeUser.register_otp;
    delete safeUser.register_otp_expiry;
    delete safeUser.forget_otp;
    delete safeUser.forget_otp_expiry;

    return { accessToken, refreshToken, user: safeUser };
};

// ─── Register ─────────────────────────────────────────────────────────────────
// controllers/authController.js → replace exports.registerUser with this

const ALLOWED_AGE_GROUPS = ["16_18", "19_21", "22_25", "26_30", "31_40"];
const ALLOWED_GENDERS = ["Male", "Female", "Others"];

exports.registerUser = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const {
            name,
            email,
            phone,
            password,
            password_confirmation,
            fcm_token,
            state,
            district,
            age_group,
            gender,
            highest_qualification,
            present_status,
            looking_for,
            agree_terms
        } = req.body;

        const errors = {};

        if (!name?.trim()) errors.name = "Name is required";
        if (!email?.trim()) errors.email = "Email is required";
        if (!phone?.trim()) errors.phone = "Phone is required";
        if (!password) errors.password = "Password is required";

        if (password && password.length < 6) {
            errors.password = "Password must be at least 6 characters";
        }

        if (password !== password_confirmation) {
            errors.password_confirmation = "Passwords do not match";
        }

        if (email && !EMAIL_REGEX.test(email.trim())) {
            errors.email = "Invalid email format";
        }

        const digits = String(phone || "").replace(/\D/g, "");

        if (phone && digits.length !== 10) {
            errors.phone = "Enter a valid 10-digit phone number";
        }

        if (!state?.trim()) errors.state = "State is required";
        if (!district?.trim()) errors.district = "District is required";
        if (!age_group?.trim()) errors.age_group = "Age group is required";
        if (!gender?.trim()) errors.gender = "Gender is required";
        if (!highest_qualification?.trim()) errors.highest_qualification = "Qualification is required";
        if (!present_status?.trim()) errors.present_status = "Present status is required";
        if (!looking_for?.trim()) errors.looking_for = "Please select what you are looking for";

        if (age_group && !ALLOWED_AGE_GROUPS.includes(age_group)) {
            errors.age_group = "Invalid age group";
        }

        if (gender && !ALLOWED_GENDERS.includes(gender)) {
            errors.gender = "Invalid gender";
        }

        if (!agree_terms) {
            errors.agree_terms = "You must accept the terms & conditions";
        }

        if (Object.keys(errors).length > 0) {
            await connection.rollback();
            connection.release();

            return res.status(422).json({
                success: false,
                message: errors
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedPhone = digits;

        const [existingUsers] = await connection.query(
            `SELECT id
             FROM users
             WHERE email = ? OR phone = ?
             LIMIT 1`,
            [normalizedEmail, normalizedPhone]
        );

        if (existingUsers.length > 0) {
            await connection.rollback();
            connection.release();

            return res.status(409).json({
                success: false,
                message: "An account with this email or phone number already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const avatarUrl =
            `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(normalizedEmail)}`;

        const [userResult] = await connection.query(
            `INSERT INTO users
            (name, email, phone, password, created_at, updated_at, avatarUrl, fcm_token)
            VALUES (?, ?, ?, ?, NOW(), NOW(), ?, ?)`,
            [
                name.trim(),
                normalizedEmail,
                normalizedPhone,
                hashedPassword,
                avatarUrl,
                fcm_token?.trim() || null
            ]
        );

        const userId = userResult.insertId;

        const [studentRows] = await connection.query(
            `SELECT registration_number
             FROM students
             WHERE registration_number LIKE 'EFOS%'
             FOR UPDATE`
        );

        let maxNumber = 0;

        for (const row of studentRows) {
            const match = row.registration_number?.match(/^EFOS(\d+)$/);
            if (match) {
                const n = parseInt(match[1], 10);
                if (n > maxNumber) maxNumber = n;
            }
        }

        const registrationNumber =
            "EFOS" + String(maxNumber + 1).padStart(3, "0");

        // 14 columns → 14 placeholders (old code had 14 cols / 9 values — SQL error)
        await connection.query(
            `INSERT INTO students
            (
                user_id,
                name,
                phone,
                email,
                state,
                district,
                age_group,
                gender,
                highest_qualification,
                present_status,
                looking_for,
                registration_number,
                agree_terms,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                userId,
                name.trim(),
                normalizedPhone,
                normalizedEmail,
                state.trim(),
                district.trim(),
                age_group.trim(),
                gender.trim(),
                highest_qualification.trim(),
                present_status.trim(),
                looking_for.trim(),
                registrationNumber,
                agree_terms ? 1 : 0
            ]
        );

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        await connection.query(
            `UPDATE users
             SET register_otp = ?, register_otp_expiry = ?
             WHERE id = ?`,
            [otp, otpExpiry, userId]
        );

        const sms = await sendDltOtp(toMobile(normalizedPhone), otp);

        if (!sms.success) {
            await connection.rollback();
            connection.release();

            return res.status(500).json({
                success: false,
                message: "Unable to send OTP. Please try again."
            });
        }

        await connection.commit();
        connection.release();

        return res.status(201).json({
            success: true,
            message: "Account created successfully!",
            user: {
                id: userId,
                name: name.trim(),
                email: normalizedEmail
            },
            phone: normalizedPhone,
            registration_number: registrationNumber
        });

    } catch (error) {
        await connection.rollback();
        connection.release();

        console.error("[registerUser]", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating your account."
        });
    }
};

// ─── Verify Register OTP ──────────────────────────────────────────────────────
exports.verifyRegisterOtp = async (req, res) => {
    try {
        const { registration_number, otp, fcm_token } = req.body;

        if (!registration_number || !otp) {
            return res.status(400).json({
                success: false,
                message: "Registration number and OTP are required."
            });
        }

        const user = await findUserByIdentifier(registration_number);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        if (!user.register_otp || String(user.register_otp) !== String(otp).trim()) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP."
            });
        }

        if (
            !user.register_otp_expiry ||
            new Date(user.register_otp_expiry) < new Date()
        ) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired."
            });
        }

        await pool.query(
            `UPDATE users
             SET register_otp = NULL,
                 register_otp_expiry = NULL,
                 email_verified_at = COALESCE(email_verified_at, NOW())
             WHERE id = ?`,
            [user.id]
        );

        const session = await issueSession(req, res, user, fcm_token || null);

        return res.json({
            success: true,
            message: "Registration verified successfully.",
            ...session
        });

    } catch (error) {
        console.error("[verifyRegisterOtp]", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong."
        });
    }
};

// ─── Login (DUAL MODE: password OR otp) ───────────────────────────────────────
// body: { registration_number, mode: "password" | "otp", password? }
exports.loginUser = async (req, res) => {
    try {
        const { registration_number, password, fcm_token } = req.body;
        const mode = (req.body.mode || (password ? "password" : "otp")).toLowerCase();

        if (!registration_number?.toString().trim()) {
            return res.status(400).json({
                success: false,
                message: "Registration number is required.",
            });
        }

        const user = await findUserByIdentifier(registration_number);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this registration number.",
            });
        }

        // ── PASSWORD MODE ────────────────────────────────────────────────
        if (mode === "password") {
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: "Password is required.",
                });
            }

            if (!user.password) {
                return res.status(400).json({
                    success: false,
                    message: "Password login not available for this account. Use OTP login.",
                });
            }

            const ok = await bcrypt.compare(password, user.password);

            if (!ok) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid registration number or password.",
                });
            }

            const session = await issueSession(req, res, user, fcm_token || null);

            return res.json({
                success: true,
                mode: "password",
                otp_required: false,
                message: "Login successful.",
                ...session
            });
        }

        // ── OTP MODE ─────────────────────────────────────────────────────
        const otp = generateOTP();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        await pool.query(
            `UPDATE users
             SET login_otp = ?, login_otp_expiry = ?, fcm_token = ?
             WHERE id = ?`,
            [otp, expiry, fcm_token, user.id]
        );

        const sms = await sendDltOtp(toMobile(user.phone), otp);

        if (!sms.success) {
            return res.status(500).json({
                success: false,
                message: "Unable to send OTP.",
            });
        }

        return res.json({
            success: true,
            mode: "otp",
            otp_required: true,
            registration_number: user.registration_number,
            message: "OTP sent successfully.",
        });

    } catch (error) {
        console.error("[loginUser]", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong.",
        });
    }
};

// ─── Verify Login OTP ─────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
    try {
        const { registration_number, otp, fcm_token } = req.body;

        if (!registration_number || !otp) {
            return res.status(400).json({
                success: false,
                message: "Registration number and OTP are required.",
            });
        }

        const user = await findUserByIdentifier(registration_number);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        if (!user.login_otp || String(user.login_otp) !== String(otp).trim()) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP.",
            });
        }

        if (
            !user.login_otp_expiry ||
            new Date(user.login_otp_expiry) < new Date()
        ) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired.",
            });
        }

        await pool.query(
            `UPDATE users
             SET login_otp = NULL, login_otp_expiry = NULL
             WHERE id = ?`,
            [user.id]
        );

        const session = await issueSession(req, res, user, fcm_token || null);

        return res.json({
            success: true,
            message: "Login successful.",
            ...session
        });

    } catch (error) {
        console.error("[verifyOtp]", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong.",
        });
    }
};

// ─── Resend Login OTP ─────────────────────────────────────────────────────────
exports.resendLoginOtp = async (req, res) => {
    try {
        const { registration_number, fcm_token } = req.body;
        console.log(fcm_token)
        if (!registration_number) {
            return res.status(400).json({
                success: false,
                message: "Registration number is required."
            });
        }

        const user = await findUserByIdentifier(registration_number);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const otp = generateOTP();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        await pool.query(
            `UPDATE users
             SET login_otp = ?, login_otp_expiry = ?,fcm_token = ?
             WHERE id = ?`,
            [otp, expiry, fcm_token, user.id]
        );

        const sms = await sendDltOtp(toMobile(user.phone), otp);

        if (!sms.success) {
            return res.status(500).json({
                success: false,
                message: "Unable to send OTP."
            });
        }

        return res.json({
            success: true,
            message: "OTP sent successfully."
        });

    } catch (err) {
        console.error("[resendLoginOtp]", err);

        return res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
};

// ─── Resend Register OTP ──────────────────────────────────────────────────────
exports.resendRegisterOtp = async (req, res) => {
    try {
        const { registration_number } = req.body;

        if (!registration_number) {
            return res.status(400).json({
                success: false,
                message: "Registration number is required."
            });
        }

        const user = await findUserByIdentifier(registration_number);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const otp = generateOTP();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        await pool.query(
            `UPDATE users
             SET register_otp = ?, register_otp_expiry = ?
             WHERE id = ?`,
            [otp, expiry, user.id]
        );

        const sms = await sendDltOtp(toMobile(user.phone), otp);

        if (!sms.success) {
            return res.status(500).json({
                success: false,
                message: "Unable to send OTP."
            });
        }

        return res.json({
            success: true,
            message: "OTP sent successfully."
        });

    } catch (err) {
        console.error("[resendRegisterOtp]", err);

        return res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
};

// ─── Forget Password — Send OTP (email) ───────────────────────────────────────
exports.forgetPassword = async (req, res) => {
    try {
        const { email, new_password } = req.body;

        if (!email?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email address",
            });
        }

        if (!new_password || new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        const chk = sanitizeRecipient(req.body.email);

        if (!chk.ok) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            });
        }
        const [[user]] = await pool.query(
            "SELECT id, email, name FROM users WHERE email = ? LIMIT 1",
            [email.toLowerCase().trim()]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email address",
            });
        }

        const otp = generateOTP();

        // new_password stored temporarily, hashed only after OTP verify
        await pool.query(
            `UPDATE users
             SET forget_otp = ?,
                 new_password = ?,
                 forget_otp_expiry = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
             WHERE id = ?`,
            [otp, new_password, user.id]
        );


        const mail = await sendEmail({
            to: user.email,
            subject: "EFOS Password Reset OTP",
            html: `
                <div style="font-family:sans-serif">
                    <h2>New OTP for Password Reset</h2>
                    <p>Hello ${user.name},</p>
                    <p>Your new OTP is:</p>
                    <h1 style="letter-spacing:6px; color:#E53935">${otp}</h1>
                    <p>This OTP will expire in 5 minutes.</p>
                </div>
            `,
        });
        if (!mail.success) {
            await pool.query(
                `UPDATE users SET forget_otp = NULL, new_password = NULL, forget_otp_expiry = NULL WHERE id = ?`,
                [user.id]
            );

            return res.status(500).json({
                success: false,
                message: "Unable to send OTP email. Please try again.",
            });
        }
        return res.json({
            success: true,
            message: "OTP has been sent to your email",
        });

    } catch (error) {
        console.error("[forgetPassword]", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};

// ─── Verify Forget Password OTP + Reset ───────────────────────────────────────
exports.verifyForgetPasswordOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required",
            });
        }

        const chk = sanitizeRecipient(req.body.email);

        if (!chk.ok) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            });
        }
        const [[user]] = await pool.query(
            `SELECT id, new_password
             FROM users
             WHERE email = ?
               AND forget_otp = ?
               AND forget_otp_expiry > NOW()
             LIMIT 1`,
            [email.toLowerCase().trim(), String(otp).trim()]
        );

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP. Please request a new one.",
            });
        }

        if (!user.new_password) {
            return res.status(400).json({
                success: false,
                message: "No new password found. Please start the process again.",
            });
        }

        const hashedPassword = await bcrypt.hash(user.new_password, 12);

        await pool.query(
            `UPDATE users
             SET password = ?,
                 forget_otp = NULL,
                 new_password = NULL,
                 forget_otp_expiry = NULL
             WHERE id = ?`,
            [hashedPassword, user.id]
        );

        // kill all old sessions after password change
        await pool.query(
            "UPDATE user_tokens SET is_revoked = 1 WHERE user_id = ?",
            [user.id]
        );

        return res.json({
            success: true,
            message: "Password reset successfully! You can now login with your new password.",
        });

    } catch (error) {
        console.error("[verifyForgetPasswordOtp]", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while resetting your password. Please try again.",
        });
    }
};

// ─── Resend Forget Password OTP ───────────────────────────────────────────────
exports.resendForgetPasswordOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email address",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const [[user]] = await pool.query(
            "SELECT id, name, email, new_password FROM users WHERE email = ? LIMIT 1",
            [normalizedEmail]
        );
        const chk = sanitizeRecipient(normalizedEmail);

        if (!chk.ok) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            });
        }
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email address",
            });
        }

        if (!user.new_password) {
            return res.status(400).json({
                success: false,
                message: "Reset session expired. Please start again.",
            });
        }

        const otp = generateOTP();

        await pool.query(
            `UPDATE users
             SET forget_otp = ?,
                 forget_otp_expiry = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
             WHERE id = ?`,
            [otp, user.id]
        );

        const mail = await sendEmail({
            to: user.email,
            subject: "EFOS Password Reset OTP",
            html: `
                <div style="font-family:sans-serif">
                    <h2>New OTP for Password Reset</h2>
                    <p>Hello ${user.name},</p>
                    <p>Your new OTP is:</p>
                    <h1 style="letter-spacing:6px; color:#E53935">${otp}</h1>
                    <p>This OTP will expire in 5 minutes.</p>
                </div>
            `,
        });

        if (!mail.success) {
            console.error("[resendForgetPasswordOtp] mail failed:", mail.error);

            return res.status(500).json({
                success: false,
                message: "Unable to send OTP email right now. Please try again.",
            });
        }

        return res.json({
            success: true,
            message: "New OTP has been sent to your email",
        });

    } catch (error) {
        console.error("[resendForgetPasswordOtp]", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }
};

// ─── Change Password (logged-in user) ─────────────────────────────────────────
exports.changePassword = async (req, res) => {
    try {
        const { current_password, new_password, new_password_confirmation } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: "Current and new password are required.",
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters.",
            });
        }

        if (
            new_password_confirmation !== undefined &&
            new_password !== new_password_confirmation
        ) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match.",
            });
        }

        const [[user]] = await pool.query(
            "SELECT id, password FROM users WHERE id = ? LIMIT 1",
            [req.user.id]
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const ok = await bcrypt.compare(current_password, user.password || "");

        if (!ok) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect.",
            });
        }

        const hashed = await bcrypt.hash(new_password, 12);

        await pool.query(
            "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?",
            [hashed, user.id]
        );

        return res.json({
            success: true,
            message: "Password changed successfully.",
        });

    } catch (error) {
        console.error("[changePassword]", error);
        return res.status(500).json({
            success: false,
            message: "Could not change password. Please try again.",
        });
    }
};

// ─── Update FCM token ─────────────────────────────────────────────────────────
exports.updateFcmToken = async (req, res) => {
    try {
        const { fcm_token } = req.body;

        if (!fcm_token?.trim()) {
            return res.status(400).json({
                success: false,
                message: "FCM token is required",
            });
        }

        await pool.query(
            "UPDATE users SET fcm_token = ?, updated_at = NOW() WHERE id = ?",
            [fcm_token.trim(), req.user.id]
        );

        return res.json({
            success: true,
            message: "FCM token updated successfully",
        });

    } catch (error) {
        console.error("[updateFcmToken]", error);

        return res.status(500).json({
            success: false,
            message: "Could not update FCM token.",
        });
    }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        const errors = {};

        if (name !== undefined && !name?.trim()) errors.name = "Name cannot be empty";
        if (email !== undefined) {
            if (!email?.trim()) errors.email = "Email cannot be empty";
            else if (!EMAIL_REGEX.test(email.trim())) errors.email = "Invalid email format";
        }
        if (phone !== undefined && !phone?.trim()) errors.phone = "Phone cannot be empty";

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ success: false, message: errors });
        }

        const [[currentUser]] = await pool.query(
            "SELECT id, name, email, phone FROM users WHERE id = ? LIMIT 1",
            [req.user.id]
        );

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const normalizedEmail = email ? email.toLowerCase().trim() : null;
        const normalizedPhone = phone ? phone.trim() : null;

        const isEmailChanging = normalizedEmail && normalizedEmail !== currentUser.email;
        const isPhoneChanging = normalizedPhone && normalizedPhone !== currentUser.phone;

        if (isEmailChanging || isPhoneChanging) {
            const conditions = [];
            const params = [];

            if (isEmailChanging) {
                conditions.push("email = ?");
                params.push(normalizedEmail);
            }
            if (isPhoneChanging) {
                conditions.push("phone = ?");
                params.push(normalizedPhone);
            }

            params.push(req.user.id);

            const [conflicts] = await pool.query(
                `SELECT id, email, phone FROM users WHERE (${conditions.join(" OR ")}) AND id != ? LIMIT 1`,
                params
            );

            if (conflicts.length > 0) {
                const conflict = conflicts[0];
                const conflictField =
                    isEmailChanging && conflict.email === normalizedEmail ? "email" : "phone number";

                return res.status(409).json({
                    success: false,
                    message: `This ${conflictField} is already linked to another account.`,
                });
            }
        }

        const updatedName = name?.trim() || currentUser.name;
        const updatedEmail = normalizedEmail || currentUser.email;
        const updatedPhone = normalizedPhone || currentUser.phone;

        await pool.query(
            `UPDATE users SET name = ?, email = ?, phone = ?, updated_at = NOW() WHERE id = ?`,
            [updatedName, updatedEmail, updatedPhone, req.user.id]
        );

        return res.json({
            success: true,
            message: "Profile updated successfully.",
            user: {
                id: req.user.id,
                name: updatedName,
                email: updatedEmail,
                phone: updatedPhone,
            },
        });

    } catch (error) {
        console.error("[updateProfile]", error);
        return res.status(500).json({
            success: false,
            message: "Could not update your profile right now. Please try again.",
        });
    }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken || req.body?.refreshToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please log in again.",
            });
        }

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch {
            return res.status(401).json({
                success: false,
                message: "Your session is invalid or has expired. Please log in again.",
            });
        }

        const [[storedToken]] = await pool.query(
            "SELECT * FROM user_tokens WHERE refresh_token = ? AND is_revoked = 0 LIMIT 1",
            [token]
        );

        if (!storedToken) {
            return res.status(403).json({
                success: false,
                message: "This session has been revoked. Please log in again.",
            });
        }

        await pool.query(
            "UPDATE user_tokens SET is_revoked = 1 WHERE refresh_token = ?",
            [token]
        );

        const newAccessToken = signToken({ id: decoded.id });
        const newRefreshToken = signRefreshToken({ id: decoded.id });

        const device = req.headers["user-agent"] || "unknown";
        const ip = req.ip;

        await pool.query(
            `INSERT INTO user_tokens (user_id, refresh_token, device, user_agent, ip_address, expires_at)
             VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
            [decoded.id, newRefreshToken, device, device, ip]
        );

        res.cookie("accessToken", newAccessToken, ACCESS_COOKIE_OPTIONS);
        res.cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTIONS);

        return res.json({
            success: true,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            message: "Session refreshed.",
        });

    } catch (error) {
        console.error("[refreshToken]", error);
        return res.status(500).json({
            success: false,
            message: "Could not refresh your session. Please log in again.",
        });
    }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
exports.logoutUser = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken || req.body?.refreshToken;

        if (token) {
            await pool.query(
                "UPDATE user_tokens SET is_revoked = 1 WHERE refresh_token = ?",
                [token]
            );
        }

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        return res.json({ success: true, message: "Logged out successfully." });

    } catch (error) {
        console.error("[logoutUser]", error);
        return res.status(500).json({
            success: false,
            message: "Logout failed. Please try again.",
        });
    }
};

// ─── Logout All Devices ───────────────────────────────────────────────────────
exports.logoutAllDevices = async (req, res) => {
    try {
        await pool.query(
            "UPDATE user_tokens SET is_revoked = 1 WHERE user_id = ?",
            [req.user.id]
        );

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        return res.json({
            success: true,
            message: "You have been logged out from all devices.",
        });

    } catch (error) {
        console.error("[logoutAllDevices]", error);
        return res.status(500).json({
            success: false,
            message: "Could not log out all devices. Please try again.",
        });
    }
};

// ─── Get Profile ──────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const [[user]] = await pool.query(
            `SELECT
                id, name, email, phone, google_id, role,
                email_verified_at, created_at, updated_at, avatarUrl
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [userId]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User profile not found.",
            });
        }

        const [[courseBuy]] = await pool.query(
            `SELECT COUNT(*) AS total_courses
             FROM course_buys
             WHERE user_id = ?`,
            [userId]
        );

        const [[student]] = await pool.query(
            `SELECT * FROM students WHERE user_id = ? LIMIT 1`,
            [userId]
        );

        let totalApply = 0;

        if (student) {
            // Fetch experiences
            const [exps] = await pool.query(
                `SELECT
                    company_name,
                    job_profile,
                    job_duration,
                    job_state,
                    job_district,
                    salary_range,
                    job_summary
                 FROM student_experiences
                 WHERE student_id = ?
                 ORDER BY id ASC`,
                [student.id]
            );

            student.experiences = exps;

            // Count job applications
            const [[applyCount]] = await pool.query(
                `SELECT COUNT(*) AS total_apply
                 FROM job_applications
                 WHERE student_id = ?`,
                [student.id]
            );

            totalApply = applyCount.total_apply;
        }

        return res.json({
            success: true,
            user,
            student: student || null,
            stats: {
                total_courses: courseBuy.total_courses || 0,
                total_apply: totalApply,
            },
        });

    } catch (error) {
        console.error("[getProfile]", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch your profile right now. Please try again.",
        });
    }
};
// ─── Delete Account ───────────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
    try {
        await pool.query(
            "UPDATE user_tokens SET is_revoked = 1 WHERE user_id = ?",
            [req.user.id]
        );

        await pool.query("DELETE FROM users WHERE id = ?", [req.user.id]);

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        return res.json({
            success: true,
            message: "Your account has been deleted. Sorry to see you go!",
        });

    } catch (error) {
        console.error("[deleteUser]", error);
        return res.status(500).json({
            success: false,
            message: "Could not delete your account right now. Please try again.",
        });
    }
};

// ─── Update Student Profile ───────────────────────────────────────────────────
exports.updateStudentProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const [students] = await pool.query(
            `SELECT id FROM students WHERE user_id = ? LIMIT 1`,
            [userId]
        );

        if (!students.length) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found"
            });
        }

        const studentId = students[0].id;

        const {
            name, phone, email, whatsapp, age_group, gender, present_status,
            state, district, pincode, address, looking_for, profile_summary,
            father_name, mother_name, category, blood_group,
            highest_qualification,
            experiences,
            tenth_board, tenth_year, tenth_marks, tenth_stream,
            twelfth_board, twelfth_year, twelfth_marks, twelfth_stream,
            graduation_university, graduation_year, graduation_marks,
            graduation_stream, graduation_field,
            pg_university, pg_year, pg_marks, pg_stream, pg_field,
            skill_type, skill_trade, skill_year,
            experience_type, passport, relocation
        } = req.body;

        const errors = {};

        if (!name?.trim()) errors.name = "Name is required";
        if (!phone?.trim()) errors.phone = "Phone is required";
        if (!email?.trim()) errors.email = "Email is required";
        if (!state?.trim()) errors.state = "State is required";
        if (!district?.trim()) errors.district = "District is required";
        if (!highest_qualification?.trim()) errors.highest_qualification = "Highest qualification is required";

        if (email && !EMAIL_REGEX.test(email.trim())) {
            errors.email = "Invalid email";
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({
                success: false,
                message: errors
            });
        }

        let photoPath = null;

        if (req.file) {
            photoPath = req.file.path.replace(/\\/g, "/");
        }

        await pool.query(
            `UPDATE students SET
                name = ?, phone = ?, email = ?, whatsapp = ?, age_group = ?,
                gender = ?, present_status = ?, state = ?, district = ?,
                pincode = ?, address = ?, looking_for = ?, profile_summary = ?,
                father_name = ?, mother_name = ?, category = ?, blood_group = ?,
                highest_qualification = ?,
                tenth_board = ?, tenth_year = ?, tenth_marks = ?, tenth_stream = ?,
                twelfth_board = ?, twelfth_year = ?, twelfth_marks = ?, twelfth_stream = ?,
                graduation_university = ?, graduation_year = ?, graduation_marks = ?,
                graduation_stream = ?, graduation_field = ?,
                pg_university = ?, pg_year = ?, pg_marks = ?, pg_stream = ?, pg_field = ?,
                skill_type = ?, skill_trade = ?, skill_year = ?,
                experience_type = ?, passport = ?, relocation = ?,
                photo = COALESCE(?, photo),
                profile_completed = 'completed',
                updated_at = NOW()
             WHERE id = ?`,
            [
                name, phone, email, whatsapp, age_group, gender, present_status,
                state, district, pincode, address, looking_for, profile_summary,
                father_name, mother_name, category, blood_group,
                highest_qualification,
                tenth_board, tenth_year, tenth_marks, tenth_stream,
                twelfth_board, twelfth_year, twelfth_marks, twelfth_stream,
                graduation_university, graduation_year, graduation_marks,
                graduation_stream, graduation_field,
                pg_university, pg_year, pg_marks, pg_stream, pg_field,
                skill_type, skill_trade, skill_year,
                experience_type, passport, relocation,
                photoPath, studentId
            ]
        );

        // ─── Experiences sync ─────────────────────────────
        const isExp = (t) => !!t && t !== "Fresher";

        let expList = experiences;
        if (typeof expList === "string") {
            try { expList = JSON.parse(expList); } catch { expList = []; }
        }
        if (!Array.isArray(expList)) expList = [];

        if (isExp(experience_type)) {
            await pool.query(
                `DELETE FROM student_experiences WHERE student_id = ?`,
                [studentId]
            );

            const rows = expList.filter(
                (e) => e && (String(e.company_name || "").trim() || String(e.job_profile || "").trim())
            );

            for (const e of rows) {
                await pool.query(
                    `INSERT INTO student_experiences
                        (student_id, company_name, job_profile, job_duration,
                         job_state, job_district, salary_range, job_summary,
                         created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                    [
                        studentId,
                        e.company_name || null,
                        e.job_profile || null,
                        e.job_duration || null,
                        e.job_state || null,
                        e.job_district || null,
                        e.salary_range || null,
                        e.job_summary || null,
                    ]
                );
            }
        } else {
            await pool.query(
                `DELETE FROM student_experiences WHERE student_id = ?`,
                [studentId]
            );
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully"
        });

    } catch (error) {
        console.error("[updateStudentProfile]", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
};
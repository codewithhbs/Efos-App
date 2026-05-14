const bcrypt = require("bcrypt");
const getPool = require("../config/db");
const { signToken, signRefreshToken, verifyToken } = require("../utils/jwt");
const { sendEmail } = require("../utils/sendEmail");
const pool = getPool();
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

// ─── Register ─────────────────────────────────────────────────────────────────
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

        if (email && !email.includes("@")) {
            errors.email = "Invalid email format";
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({
                success: false,
                message: errors
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedPhone = phone.trim();

        // Check Existing User
        const [existingUsers] = await connection.query(
            `SELECT id,email,phone 
             FROM users 
             WHERE email = ? OR phone = ?
             LIMIT 1`,
            [normalizedEmail, normalizedPhone]
        );

        if (existingUsers.length > 0) {
            const existing = existingUsers[0];

            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: `An account with this ${existing.email === normalizedEmail
                    ? "Email"
                    : "Phone Number"
                    } already exists.`
            });
        }

        // Create User
        const hashedPassword = await bcrypt.hash(password, 12);

        const avatarUrl =
            `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(normalizedEmail)}`;

        const [userResult] = await connection.query(
            `INSERT INTO users
            (name,email,phone,password,created_at,updated_at,avatarUrl,fcm_token)
            VALUES (?, ?, ?, ?, NOW(), NOW(), ?, ?)`,
            [
                name.trim(),
                normalizedEmail,
                normalizedPhone,
                hashedPassword,
                avatarUrl,
                fcm_token || null
            ]
        );

        const userId = userResult.insertId;

        // Generate Registration Number
        const [lastStudent] = await connection.query(
            `SELECT id, registration_number
             FROM students
             ORDER BY id DESC
             LIMIT 1
             FOR UPDATE`
        );

        let nextNumber = 1;

        if (
            lastStudent.length &&
            lastStudent[0].registration_number
        ) {
            const match =
                lastStudent[0].registration_number.match(/EFOS(\d+)/);

            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }

        const registrationNumber =
            "EFOS" + String(nextNumber).padStart(3, "0");

        // Create Student
        await connection.query(
            `INSERT INTO students
            (
                user_id,
                name,
                phone,
                email,
                state,
                district,
                looking_for,
                registration_number,
                agree_terms,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                userId,
                name.trim(),
                normalizedPhone,
                normalizedEmail,
                state || null,
                district || null,
                looking_for || null,
                registrationNumber,
                agree_terms ? 1 : 0
            ]
        );

        // Tokens
        const accessToken = signToken({
            id: userId,
            email: normalizedEmail
        });

        const refreshToken = signRefreshToken({
            id: userId
        });

        const device = req.headers["user-agent"] || "unknown";
        const ip = req.ip;

        await connection.query(
            `INSERT INTO user_tokens
            (
                user_id,
                refresh_token,
                device,
                user_agent,
                ip_address,
                expires_at
            )
            VALUES
            (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
            [userId, refreshToken, device, device, ip]
        );

        await connection.commit();
        connection.release();

        res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);
        res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

        return res.status(201).json({
            success: true,
            message: "Account created successfully!",
            accessToken,
            refreshToken,
            user: {
                id: userId,
                name: name.trim(),
                email: normalizedEmail
            },
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

// Forget Password - Send OTP
exports.forgetPassword = async (req, res) => {
    try {
        const { email, new_password } = req.body;
        console.log(req.body)
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

        // Check if user exists
        const [[user]] = await pool.query(
            "SELECT id, email, name FROM users WHERE email = ? LIMIT 1",
            [email.toLowerCase()]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email address",
            });
        }

        const otp = generateOTP();

        // Save OTP and new password temporarily
        await pool.query(
            `UPDATE users 
       SET forget_otp = ?, 
           new_password = ?,
           forget_otp_expiry = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
       WHERE email = ?`,
            [otp, new_password, email.toLowerCase()]
        );

        // Send OTP email
        await sendEmail({
            to: email,
            subject: "EFOS Password Reset OTP",
            html: `
        <div style="font-family:sans-serif">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>Your OTP for password reset is:</p>
          <h1 style="letter-spacing:6px; color:#6C63FF">${otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
        });

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


// Verify OTP and Reset Password
exports.verifyForgetPasswordOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required",
            });
        }

        // Verify OTP
        const [[user]] = await pool.query(
            `SELECT id, new_password 
       FROM users 
       WHERE email = ? 
       AND forget_otp = ? 
       AND forget_otp_expiry > NOW()`,
            [email.toLowerCase(), otp]
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

        // Hash the new password
        const hashedPassword = await bcrypt.hash(user.new_password, 12);

        // Update password and clear OTP fields
        await pool.query(
            `UPDATE users 
       SET password = ?, 
           forget_otp = NULL, 
           new_password = NULL, 
           forget_otp_expiry = NULL 
       WHERE id = ?`,
            [hashedPassword, user.id]
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


// Resend OTP
exports.resendForgetPasswordOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email address",
            });
        }

        const [[user]] = await pool.query(
            "SELECT id, name FROM users WHERE email = ? LIMIT 1",
            [email.toLowerCase()]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email address",
            });
        }

        const otp = generateOTP();

        await pool.query(
            `UPDATE users 
       SET forget_otp = ?, 
           forget_otp_expiry = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
       WHERE email = ?`,
            [otp, email.toLowerCase()]
        );

        await sendEmail({
            to: email,
            subject: "EFOS Password Reset OTP",
            html: `
        <div style="font-family:sans-serif">
          <h2>New OTP for Password Reset</h2>
          <p>Hello ${user.name},</p>
          <p>Your new OTP is:</p>
          <h1 style="letter-spacing:6px; color:#6C63FF">${otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
        </div>
      `,
        });

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

// ─── Login ────────────────────────────────────────────────────────────────────
exports.loginUser = async (req, res) => {
    try {
        const { registration_number, password } = req.body;

        if (!registration_number?.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "Registration number and password are required.",
            });
        }

        const [[user]] = await pool.query(
            "SELECT * FROM users WHERE phone = ? LIMIT 1",
            [registration_number.trim()]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "No account found with that registration number.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password. Please try again.",
            });
        }

        const accessToken = signToken({ id: user.id });
        const refreshToken = signRefreshToken({ id: user.id });

        const device = req.headers["user-agent"] || "unknown";
        const ip = req.ip;

        await pool.query(
            `INSERT INTO user_tokens (user_id, refresh_token, device, user_agent, ip_address, expires_at)
             VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
            [user.id, refreshToken, device, device, ip]
        );

        res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);
        res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

        return res.json({
            accessToken,
            user,
            refreshToken,
            success: true,
            message: "Logged in successfully.",
        });

    } catch (error) {
        console.error("[loginUser]", error);
        return res.status(500).json({
            success: false,
            message: "Unable to log in right now. Please try again shortly.",
        });
    }
};

// ─── Update Fcm token ────────────────────────────────────────────────────────────────────
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
            message: error,
        });
    }
};

// ─── Update ────────────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        const errors = {};

        if (name !== undefined && !name?.trim()) errors.name = "Name cannot be empty";
        if (email !== undefined) {
            if (!email?.trim()) errors.email = "Email cannot be empty";
            else if (!email.includes("@")) errors.email = "Invalid email format";
        }
        if (phone !== undefined && !phone?.trim()) errors.phone = "Phone cannot be empty";

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({ success: false, message: errors });
        }

        // ─── Fetch Current User ───────────────────────────────────────────────
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

        // ─── Check Conflicts ──────────────────────────────────────────────────
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

        // ─── Build Update Payload ─────────────────────────────────────────────
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
        const token = req.cookies?.refreshToken;

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

        // Token rotation — revoke old, issue new
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

        return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken, success: true, message: "Session refreshed." });

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
        const token = req.cookies?.refreshToken;

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

        // user basic profile
        const [[user]] = await pool.query(
            `SELECT 
                id,
                name,
                email,
                phone,
                google_id,
                role,
                email_verified_at,
                created_at,
                updated_at,
                avatarUrl
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

        // total purchased courses by user_id
        const [[courseBuy]] = await pool.query(
            `SELECT COUNT(*) AS total_courses
             FROM course_buys
             WHERE user_id = ?`,
            [userId]
        );

        // check student profile id from user_id
        const [[student]] = await pool.query(
            `SELECT *
             FROM students
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        let totalApply = 0;

        // if student exists then count applied jobs
        if (student) {
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
            student: student ? student : null,
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

        await pool.query(
            "DELETE FROM users WHERE id = ?",
            [req.user.id]
        );

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





exports.updateStudentProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find student by user id
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
            name,
            phone,
            email,
            whatsapp,
            age_group,
            gender,
            present_status,
            state,
            district,
            pincode,
            address,
            looking_for,
            profile_summary,

            father_name,
            mother_name,
            category,
            blood_group,

            highest_qualification,

            tenth_board,
            tenth_year,
            tenth_marks,
            tenth_stream,

            twelfth_board,
            twelfth_year,
            twelfth_marks,
            twelfth_stream,

            graduation_university,
            graduation_year,
            graduation_marks,
            graduation_stream,
            graduation_field,

            pg_university,
            pg_year,
            pg_marks,
            pg_stream,
            pg_field,

            skill_type,
            skill_trade,
            skill_year,

            experience_type,
            passport,
            relocation
        } = req.body;
        console.log(req.body)
        console.log(req.file)

        // Validation
        const errors = {};

        if (!name?.trim()) errors.name = "Name is required";
        if (!phone?.trim()) errors.phone = "Phone is required";
        if (!email?.trim()) errors.email = "Email is required";
        if (!state?.trim()) errors.state = "State is required";
        if (!district?.trim()) errors.district = "District is required";
        if (!highest_qualification?.trim()) errors.highest_qualification = "Highest qualification is required";

        if (email && !email.includes("@")) {
            errors.email = "Invalid email";
        }

        if (Object.keys(errors).length > 0) {
            return res.status(422).json({
                success: false,
                message: errors
            });
        }

        // Photo Upload
        let photoPath = null;

        if (req.file) {
            photoPath = req.file.path.replace(/\\/g, "/");
        }

        // Update Query
        await pool.query(
            `UPDATE students SET
                name = ?,
                phone = ?,
                email = ?,
                whatsapp = ?,
                age_group = ?,
                gender = ?,
                present_status = ?,
                state = ?,
                district = ?,
                pincode = ?,
                address = ?,
                looking_for = ?,
                profile_summary = ?,

                father_name = ?,
                mother_name = ?,
                category = ?,
                blood_group = ?,

                highest_qualification = ?,

                tenth_board = ?,
                tenth_year = ?,
                tenth_marks = ?,
                tenth_stream = ?,

                twelfth_board = ?,
                twelfth_year = ?,
                twelfth_marks = ?,
                twelfth_stream = ?,

                graduation_university = ?,
                graduation_year = ?,
                graduation_marks = ?,
                graduation_stream = ?,
                graduation_field = ?,

                pg_university = ?,
                pg_year = ?,
                pg_marks = ?,
                pg_stream = ?,
                pg_field = ?,

                skill_type = ?,
                skill_trade = ?,
                skill_year = ?,

                experience_type = ?,
                passport = ?,
                relocation = ?,

                photo = COALESCE(?, photo),
                profile_completed = 'completed',
                updated_at = NOW()

             WHERE id = ?`,
            [
                name,
                phone,
                email,
                whatsapp,
                age_group,
                gender,
                present_status,
                state,
                district,
                pincode,
                address,
                looking_for,
                profile_summary,

                father_name,
                mother_name,
                category,
                blood_group,

                highest_qualification,

                tenth_board,
                tenth_year,
                tenth_marks,
                tenth_stream,

                twelfth_board,
                twelfth_year,
                twelfth_marks,
                twelfth_stream,

                graduation_university,
                graduation_year,
                graduation_marks,
                graduation_stream,
                graduation_field,

                pg_university,
                pg_year,
                pg_marks,
                pg_stream,
                pg_field,

                skill_type,
                skill_trade,
                skill_year,

                experience_type,
                passport,
                relocation,

                photoPath,
                studentId
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully"
        });

    } catch (error) {
        console.error("UpdateStudentProfile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
};




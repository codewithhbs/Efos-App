const getPool = require("../config/db");
const zoomService = require("../utils/zoomService");
const pool = getPool();
const axios = require("axios");


exports.getAllLessonsChapters = async (req, res) => {
    try {
        const { courseId } = req.params;

        const parseCourseId = parseInt(courseId);

        // ==============================
        // VALIDATION
        // ==============================
        if (
            isNaN(parseCourseId) ||
            parseCourseId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid course id.",
            });
        }

        // ==============================
        // GET CHAPTERS
        // ==============================
        const [chapters] = await pool.query(
            `SELECT *
             FROM course_chapters
             WHERE course_id = ?
             AND status = 1
             ORDER BY sort_order ASC, id ASC`,
            [parseCourseId]
        );

        if (chapters.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "No chapters found for this course.",
            });
        }

        // ==============================
        // GET QUIZZES
        // ==============================
        const [quizzes] = await pool.query(
            `SELECT *
             FROM quizzes
             WHERE course_id = ?
             AND is_active = 1
             ORDER BY id ASC`,
            [parseCourseId]
        );

        // ==============================
        // MERGE QUIZZES INTO CHAPTERS
        // ==============================
        const formattedChapters = chapters.map(
            (chapter) => {
                // quizzes of current chapter
                const chapterQuizzes =
                    quizzes.filter(
                        (quiz) =>
                            Number(
                                quiz.chapter_id
                            ) ===
                            Number(chapter.id)
                    );

                return {
                    ...chapter,

                    quizzes: chapterQuizzes,

                    quizCount:
                        chapterQuizzes.length,

                    hasQuiz:
                        chapterQuizzes.length >
                        0,

                    uiFlags: {
                        showQuizBadge:
                            chapterQuizzes.length >
                            0,
                    },
                };
            }
        );

        // ==============================
        // RESPONSE
        // ==============================
        return res.status(200).json({
            success: true,
            message:
                "Course chapters fetched successfully.",

            meta: {
                courseId: parseCourseId,
                totalChapters:
                    formattedChapters.length,
                totalQuizzes:
                    quizzes.length,
            },

            chapters: formattedChapters,
        });
    } catch (error) {
        console.error(
            "getAllLessonsChapters Error =>",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Something went wrong while fetching chapters.",
            error: error.message,
        });
    }
};


exports.getVideosByLessonId = async (req, res) => {
    try {
        const userId = req?.user?.id || null;
        const { lessonId, courseId } = req.params;

        const parseLessonId = Number(lessonId);
        const parseCourseId = Number(courseId);
        const parseUserId = Number(userId);

        // =====================================
        // BASIC VALIDATION
        // =====================================
        if (!parseUserId) {
            return res.status(401).json({
                success: false,
                uiFlag: "AUTH_REQUIRED",
                message: "Please login to continue.",
            });
        }

        if (
            Number.isNaN(parseLessonId) ||
            Number.isNaN(parseCourseId) ||
            parseLessonId <= 0 ||
            parseCourseId <= 0
        ) {
            return res.status(400).json({
                success: false,
                uiFlag: "INVALID_REQUEST",
                message:
                    "Invalid lesson or course request.",
            });
        }

        const baseUrl = process.env.APP_API_URL || "";

        // =====================================
        // CHECK COURSE EXISTS
        // =====================================
        const [courseRows] = await pool.query(
            `SELECT id, title, status
             FROM learning_courses
             WHERE id = ?
             LIMIT 1`,
            [parseCourseId]
        );

        if (courseRows.length === 0) {
            return res.status(404).json({
                success: false,
                uiFlag: "COURSE_NOT_FOUND",
                message: "Course not found.",
            });
        }

        if (courseRows[0].status !== 1) {
            return res.status(403).json({
                success: false,
                uiFlag: "COURSE_DISABLED",
                message:
                    "This course is currently unavailable.",
            });
        }

        // =====================================
        // CHECK LESSON / CHAPTER EXISTS
        // =====================================
        const [chapterRows] = await pool.query(
            `SELECT id, title
             FROM course_chapters
             WHERE id = ?
             AND course_id = ?
             LIMIT 1`,
            [parseLessonId, parseCourseId]
        );

        if (chapterRows.length === 0) {
            return res.status(404).json({
                success: false,
                uiFlag: "LESSON_NOT_FOUND",
                message:
                    "Lesson section not found.",
            });
        }

        // =====================================
        // CHECK COURSE ACCESS
        // =====================================
        const [accessRows] = await pool.query(
            `SELECT id
             FROM course_buys
             WHERE user_id = ?
             AND learning_course_id = ?
             AND payment_status = 'success'
             AND is_active = 1
             LIMIT 1`,
            [parseUserId, parseCourseId]
        );

        if (accessRows.length === 0) {
            return res.status(403).json({
                success: false,
                uiFlag: "COURSE_ACCESS_DENIED",
                message:
                    "You don't have access to this course.",
            });
        }

        // =====================================
        // OPTIONAL EXPIRY CHECK
        // =====================================
        // const accessData = accessRows[0];

        // if (
        //     accessData.expiry_date &&
        //     new Date(accessData.expiry_date) < new Date()
        // ) {
        //     return res.status(403).json({
        //         success: false,
        //         uiFlag: "COURSE_ACCESS_EXPIRED",
        //         message:
        //             "Your course access has expired.",
        //     });
        // }

        // =====================================
        // GET LESSON VIDEOS
        // =====================================
        const [rows] = await pool.query(
            `SELECT *
             FROM course_lessons
             WHERE course_id = ?
             AND chapter_id = ?
             AND status = 1
             ORDER BY id ASC`,
            [parseCourseId, parseLessonId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                uiFlag: "NO_CONTENT",
                message:
                    "No lessons available in this section.",
            });
        }

        // =====================================
        // GET QUIZZES
        // =====================================
        const [quizzes] = await pool.query(
            `SELECT *
             FROM quizzes
             WHERE course_id = ?
             AND chapter_id = ?
             AND is_active = 1
             ORDER BY id ASC`,
            [parseCourseId, parseLessonId]
        );

        // =====================================
        // FORMAT RESPONSE
        // =====================================
        const formattedRows = rows.map((item) => ({
            ...item,

            pdf_file: item.pdf_file
                ? item.pdf_file.startsWith("http")
                    ? item.pdf_file
                    : `${baseUrl}${item.pdf_file}`
                : null,

            video_url: item.video_url
                ? item.video_url.startsWith("http")
                    ? item.video_url
                    : `${baseUrl}${item.video_url}`
                : null,

            thumbnail: item.thumbnail
                ? item.thumbnail.startsWith("http")
                    ? item.thumbnail
                    : `${baseUrl}${item.thumbnail}`
                : null,

            content: item.content || null,

            quizzes,

            uiFlags: {
                hasPdf: !!item.pdf_file,
                hasVideo: !!item.video_url,
                hasContent: !!item.content,
                hasQuiz: quizzes.length > 0,
                isLocked: false,
            },
        }));

        // =====================================
        // SUCCESS RESPONSE
        // =====================================
        return res.status(200).json({
            success: true,
            uiFlag: "LESSONS_FETCHED",
            message: "Lessons loaded successfully.",

            meta: {
                totalLessons: formattedRows.length,
                totalQuizzes: quizzes.length,
                chapterId: parseLessonId,
                courseId: parseCourseId,
            },

            videos: formattedRows,
        });
    } catch (error) {
        console.error(
            "getVideosByLessonId Error =>",
            error
        );

        return res.status(500).json({
            success: false,
            uiFlag: "SERVER_ERROR",
            message:
                "Something went wrong while loading lessons. Please try again later.",
        });
    }
};

exports.getAllQuizes = async (req, res) => {
    try {
        console.log(req.params)
        const { id } = req.params;

        // Validation
        if (!id) {
            return res.status(400).json({
                success: false,
                message: " course has no quiz",
            });
        }

        // Get quizzes
        const [quizzes] = await pool.query(
            `SELECT *
             FROM quizzes
             WHERE course_id = ?
             AND is_active = 1
             ORDER BY id ASC`,
            [id]
        );

        return res.status(200).json({
            success: true,
            count: quizzes.length,
            quizzes,
        });

    } catch (error) {
        console.error("Get quizzes error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
};




// ======================================================
// GET ALL MENTORS
// ======================================================
exports.getAllMentors = async (req, res) => {
    try {
        const baseUrl = process.env.APP_API_URL || "";

        // Query Params
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search ? req.query.search.trim() : "";

        const offset = (page - 1) * limit;

        // Search Condition
        let whereClause = `WHERE mp.status = 'approved'`;
        let params = [];

        if (search) {
            whereClause += `
        AND (
          mp.name LIKE ?
          OR mp.skills LIKE ?
          OR mp.city LIKE ?
          OR mc.name LIKE ?
        )
      `;

            const keyword = `%${search}%`;
            params.push(keyword, keyword, keyword, keyword);
        }

        // Total Count
        const [countRows] = await pool.query(
            `
      SELECT COUNT(*) AS total
      FROM mentor_profiles mp
      LEFT JOIN mentor_categories mc
        ON mc.id = mp.mentor_category_id
      ${whereClause}
      `,
            params
        );

        const total = countRows[0].total;
        const totalPages = Math.ceil(total / limit);

        // Main Data Query
        const [rows] = await pool.query(
            `
      SELECT 
        mp.id,
        mp.user_id,
        mp.name,
        mp.slug,
        mp.email,
        mp.phone,
        mp.state,
        mp.city,
        mp.shortbio,
        mp.skills,
        mp.experience,
        mp.profile_photo,
        mc.name AS category_name
      FROM mentor_profiles mp
      LEFT JOIN mentor_categories mc
        ON mc.id = mp.mentor_category_id
      ${whereClause}
      ORDER BY mp.id DESC
      LIMIT ? OFFSET ?
      `,
            [...params, limit, offset]
        );

        const mentors = rows.map(item => ({
            ...item,
            profile_photo: item.profile_photo
                ? `${baseUrl}${item.profile_photo}`
                : null
        }));

        return res.status(200).json({
            success: true,
            page,
            limit,
            total,
            totalPages,
            count: mentors.length,
            data: mentors
        });

    } catch (error) {
        console.log("Get All Mentors Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch mentors"
        });
    }
};

exports.getAllMentorsCategories = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, name FROM mentor_categories WHERE status = 1 ORDER BY name ASC`
        );
        return res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.log("Get Mentor Categories Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch mentor categories"
        });
    }
};


exports.getOneMentor = async (req, res) => {
    try {
        const baseUrl = process.env.APP_API_URL || "";
        const { id } = req.params;

        // =========================
        // Get Mentor Details
        // =========================
        const [rows] = await pool.query(
            `
      SELECT 
        mp.id,
        mp.user_id,
        mp.mentor_category_id,
        mp.name,
        mp.slug,
        mp.email,
        mp.phone,
        mp.state,
        mp.city,
        mp.zip_code,
        mp.address,
        mp.shortbio,
        mp.bio,
        mp.skills,
        mp.experience,
        mp.profile_photo,
        mp.status,
        mp.created_at,
        mp.updated_at,
        mc.name AS category_name
      FROM mentor_profiles mp
      LEFT JOIN mentor_categories mc
        ON mc.id = mp.mentor_category_id
      WHERE mp.id = ?
      LIMIT 1
      `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Mentor not found"
            });
        }

        const mentor = rows[0];

        mentor.profile_photo = mentor.profile_photo
            ? `${baseUrl}${mentor.profile_photo}`
            : null;

        // =========================
        // Get Available Prices
        // =========================
        const [prices] = await pool.query(
            `
      SELECT
        id,
        mentor_id,
        duration_minutes,
        price,
        discount_price,
        is_free,
        session_type,
        meeting_platform,
        status
      FROM mentor_session_prices
      WHERE mentor_id = ?
      AND status = 1
      ORDER BY duration_minutes ASC
      `,
            [id]
        );

        return res.status(200).json({
            success: true,
            data: {
                ...mentor,
                available_prices: prices
            }
        });

    } catch (error) {
        console.log("Get One Mentor Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch mentor"
        });
    }
};

function generateOrderId() {
    return `SESSION_${Date.now()}_${Math.floor(Math.random() * 99999)}`;
}

// ─── Helper: initiate cashfree order ─────────────────────────────────────────
async function initiateCashfreeOrder({
    res,
    bookingTitle,
    userId,
    customer_name,
    customer_email,
    customer_phone,
    amount,
    order_id
}) {
    const APP_ID = process.env.CASHFREE_API_KEY;
    const SECRET_KEY = process.env.CASHFREE_API_SECRET;
    const CASHFREE_URL = process.env.CASHFREE_URL;
    const MODE = process.env.CASHFREE_MODE;

    const payload = {
        order_id,
        order_amount: amount,
        order_currency: "INR",

        customer_details: {
            customer_id: String(userId),
            customer_name,
            customer_email,
            customer_phone
        },

        order_meta: {
            return_url: `${process.env.APP_API_URL}/payment-success?order_id={order_id}`
        },

        order_note: bookingTitle
    };

    try {
        const response = await axios.post(CASHFREE_URL, payload, {
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                "x-client-id": APP_ID,
                "x-client-secret": SECRET_KEY,
                "x-api-version": "2023-08-01"
            }
        });

        return res.status(200).json({
            success: true,
            message: "Payment initiated successfully",
            data: {
                order_id: response.data.order_id,
                payment_session_id: response.data.payment_session_id,
                cf_order_id: response.data.cf_order_id,
                amount,
                environment: MODE === "production" ? "PRODUCTION" : "SANDBOX"
            }
        });

    } catch (error) {
        console.log("Cashfree Error:", error?.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "Payment gateway error. Please try again."
        });
    }
}


// =============================================================================
// POST /api/v1/extra/mentors/book-session
// =============================================================================
exports.bookSession = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const user = req.user;

        const { mentor_id, session_price_id, session_date, start_time } = req.body;

        // ── Validate required fields ──────────────────────────────────────────
        if (!mentor_id || !session_price_id || !session_date || !start_time) {
            return res.status(422).json({
                success: false,
                message: "mentor_id, session_price_id, session_date and start_time are required."
            });
        }

        // ── Validate date format (YYYY-MM-DD) ─────────────────────────────────
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(session_date)) {
            return res.status(422).json({
                success: false,
                message: "Invalid date format. Use YYYY-MM-DD."
            });
        }

        // ── Reject past dates ─────────────────────────────────────────────────
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const bookedDate = new Date(session_date);
        if (bookedDate < today) {
            return res.status(422).json({
                success: false,
                message: "Cannot book a session for a past date."
            });
        }

        // ── Fetch session plan ────────────────────────────────────────────────
        const [[plan]] = await connection.query(
            `SELECT * FROM mentor_session_prices
             WHERE id = ? AND mentor_id = ? AND status = 1
             LIMIT 1`,
            [session_price_id, mentor_id]
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Session plan not found or is no longer available."
            });
        }

        // ── Calculate end time ────────────────────────────────────────────────
        const duration = parseInt(plan.duration_minutes);
        const [h, m] = start_time.split(":").map(Number);
        const startMins = h * 60 + m;
        const endMins = startMins + duration;
        const endHour = Math.floor(endMins / 60).toString().padStart(2, "0");
        const endMin = (endMins % 60).toString().padStart(2, "0");
        const end_time = `${endHour}:${endMin}:00`;

        // ── Block if slot already confirmed by someone ────────────────────────
        const [confirmed] = await connection.query(
            `SELECT id FROM session_bookings
             WHERE mentor_id = ?
               AND session_date = ?
               AND payment_status = 'success'
               AND (? < end_time AND ? > start_time)`,
            [mentor_id, session_date, start_time, end_time]
        );

        if (confirmed.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This slot is already booked. Please choose a different time."
            });
        }

        // ── Delete any stale pending booking for this slot ────────────────────
        // Allows user to retry payment for same slot without hitting unique key error
        await connection.query(
            `DELETE FROM session_bookings
             WHERE mentor_id = ?
               AND session_date = ?
               AND start_time = ?
               AND payment_status = 'pending'`,
            [mentor_id, session_date, start_time]
        );

        // ── Fetch student profile ─────────────────────────────────────────────
        const [[student]] = await pool.query(
            `SELECT id, name, phone, email FROM students
             WHERE user_id = ? LIMIT 1`,
            [user.id]
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found. Please complete your profile first."
            });
        }

        // ── Final price ───────────────────────────────────────────────────────
        const finalPrice = plan.discount_price > 0 ? plan.discount_price : plan.price;
        const order_id = generateOrderId();

        // ── Insert booking (pending) ──────────────────────────────────────────
        await connection.query(
            `INSERT INTO session_bookings
             (
               mentor_id, student_id, session_price_id,
               session_date, start_time, end_time, duration_minutes,
               price, discount_price, final_price,
               payment_status, payment_gateway, transaction_id,
               meeting_platform, status, created_at, updated_at
             )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'cashfree', ?, ?, 'pending', NOW(), NOW())`,
            [
                mentor_id,
                student.id,
                session_price_id,
                session_date,
                start_time,
                end_time,
                duration,
                plan.price,
                plan.discount_price,
                finalPrice,
                order_id,
                plan.meeting_platform
            ]
        );

        // ── Initiate Cashfree payment ─────────────────────────────────────────
        return initiateCashfreeOrder({
            res,
            bookingTitle: "Mentor Session Booking",
            userId: student.id,
            customer_name: student.name,
            customer_email: student.email,
            customer_phone: student.phone,
            amount: finalPrice,
            order_id
        });

    } catch (error) {
        // Catch any remaining duplicate key (race condition safety net)
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "This slot was just taken. Please select another time."
            });
        }

        console.log("Book Session Error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while booking. Please try again."
        });

    } finally {
        connection.release();
    }
};


exports.verifyBookingPayment = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const orderId = req.query.order_id || req.body.order_id;
        console.log("Verifying payment for order_id:", orderId);
        if (!orderId) {
            return res.status(422).json({
                success: false,
                message: "order_id required"
            });
        }

        // ========================================
        // Get Booking
        // ========================================
        const [[booking]] = await connection.query(
            `SELECT *
       FROM session_bookings
       WHERE transaction_id = ?
       LIMIT 1`,
            [orderId]
        );

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Already Paid
        if (booking.payment_status === "success") {
            return res.status(200).json({
                success: true,
                message: "Payment already verified",
                data: booking
            });
        }

        // ========================================
        // Verify Cashfree Payment
        // ========================================
        const response = await axios.get(
            `${process.env.CASHFREE_URL}/${orderId}`,
            {
                headers: {
                    "x-client-id": process.env.CASHFREE_API_KEY,
                    "x-client-secret": process.env.CASHFREE_API_SECRET,
                    "x-api-version": "2023-08-01"
                }
            }
        );

        const payment = response.data;
        console.log("Payment Verification Response:", payment);

        if (payment.order_status !== "PAID") {
            await connection.query(
                `UPDATE session_bookings
         SET payment_status = 'failed',
             updated_at = NOW()
         WHERE id = ?`,
                [booking.id]
            );

            return res.status(400).json({
                success: false,
                message: "Payment not completed"
            });
        }

        // ========================================
        // Start Transaction
        // ========================================
        await connection.beginTransaction();

        try {
            // Create ISO DateTime
            const startDateTime =
                `${booking.session_date}T${booking.start_time}+05:30`;

            // ====================================
            // Generate Zoom Meeting
            // ====================================
            let zoomMeeting = null;

            if (
                booking.meeting_platform === "zoom"
            ) {
                zoomMeeting =
                    await zoomService.createMeeting(
                        "Mentor Session",
                        startDateTime,
                        booking.duration_minutes
                    );
            }

            // ====================================
            // Update Booking
            // ====================================
            await connection.query(
                `UPDATE session_bookings
         SET payment_status = 'success',
             status = 'accepted',
             zoom_meeting_id = ?,
             zoom_join_url = ?,
             zoom_start_url = ?,
             zoom_password = ?,
             updated_at = NOW()
         WHERE id = ?`,
                [
                    zoomMeeting?.id || null,
                    zoomMeeting?.join_url || null,
                    zoomMeeting?.start_url || null,
                    zoomMeeting?.password || null,
                    booking.id
                ]
            );

            await connection.commit();

            // Get Updated Booking
            const [[updatedBooking]] =
                await connection.query(
                    `SELECT * FROM session_bookings
           WHERE id = ?`,
                    [booking.id]
                );

            return res.status(200).json({
                success: true,
                message:
                    "Payment verified and booking confirmed",
                data: updatedBooking
            });

        } catch (error) {
            await connection.rollback();

            console.log(
                "Zoom Meeting Error:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Payment received but Zoom meeting creation failed"
            });
        }

    } catch (error) {
        console.log(
            "Verify Booking Error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: false,
            message: "Verification failed"
        });

    } finally {
        connection.release();
    }
};

exports.getMyBookingsDetails = async (req, res) => {
    try {
        const userId = req?.user?.id || null;
        const orderId = req.params.orderId; // SESSION_1777031249844_6745

        const parseUserId = parseInt(userId);

        // =====================================
        // Validate User
        // =====================================
        if (!parseUserId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        // =====================================
        // Get Student
        // =====================================
        const [[student]] = await pool.query(
            `SELECT id 
       FROM students 
       WHERE user_id = ? 
       LIMIT 1`,
            [parseUserId]
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found."
            });
        }

        // =====================================
        // Get Booking
        // transaction_id is string like:
        // SESSION_1777031249844_6745
        // so DON'T parseInt()
        // =====================================
        const [rows] = await pool.query(
            `SELECT 
          sb.*,
          mp.name AS mentor_name,
          mp.profile_photo AS mentor_photo,
          msp.duration_minutes,
          msp.price,
          msp.discount_price
       FROM session_bookings sb
       JOIN mentor_profiles mp 
         ON mp.id = sb.mentor_id
       JOIN mentor_session_prices msp 
         ON msp.id = sb.session_price_id
       WHERE sb.student_id = ?
       AND sb.transaction_id = ?
       LIMIT 1`,
            [student.id, orderId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        const booking = rows[0];

        const baseUrl = process.env.APP_API_URL || "";

        booking.mentor_photo = booking.mentor_photo
            ? `${baseUrl}${booking.mentor_photo}`
            : null;

        return res.status(200).json({
            success: true,
            data: booking
        });

    } catch (error) {
        console.log("Get Booking Details Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch booking details"
        });
    }
};

// =====================================================
// GET AVAILABLE TIME SLOTS API
// =====================================================
// URL:
// GET /api/mentors/:mentorId/slots?date=2026-04-30&session_price_id=5
//
// User flow:
// 1. User chooses mentor
// 2. User chooses session duration (30 min etc)
// 3. User chooses date
// 4. API returns only free slots
// 5. Already booked slots hidden
// =====================================================

exports.getMentorAvailableSlots = async (req, res) => {
    try {
        const { mentorId } = req.params;
        const { date, session_price_id } = req.query;

        if (!date || !session_price_id) {
            return res.status(422).json({
                success: false,
                message: "date and session_price_id required"
            });
        }

        // =====================================
        // STEP 1: Get Session Duration
        // =====================================
        const [[session]] = await pool.query(
            `SELECT id, duration_minutes
       FROM mentor_session_prices
       WHERE id = ?
       AND mentor_id = ?
       AND status = 1
       LIMIT 1`,
            [session_price_id, mentorId]
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session plan not found"
            });
        }

        const duration = parseInt(session.duration_minutes);

        // =====================================
        // STEP 2: Get Day Name
        // =====================================
        const dayName = new Date(date)
            .toLocaleDateString("en-US", { weekday: "long" })
            .toLowerCase();

        // =====================================
        // STEP 3: Get Availability
        // =====================================
        const [[availability]] = await pool.query(
            `SELECT *
       FROM mentor_availabilities
       WHERE mentor_id = ?
       AND day = ?
       AND is_active = 1
       LIMIT 1`,
            [mentorId, dayName]
        );

        if (!availability) {
            return res.status(200).json({
                success: true,
                slots: [],
                message: "Mentor unavailable"
            });
        }

        // =====================================
        // STEP 4: Get Paid Bookings Only
        // =====================================
        const [bookings] = await pool.query(
            `SELECT start_time, end_time
       FROM session_bookings
       WHERE mentor_id = ?
       AND session_date = ?
       AND payment_status = 'success'`,
            [mentorId, date]
        );

        // =====================================
        // STEP 5: Check Today Current Time
        // =====================================
        const today = new Date();
        const todayDate = today.toISOString().split("T")[0];

        let currentMinutes = 0;

        if (date === todayDate) {
            currentMinutes =
                today.getHours() * 60 + today.getMinutes();
        }

        // =====================================
        // STEP 6: Generate Slots
        // =====================================
        const slots = [];

        const start = convertToMinutes(
            availability.start_time
        );

        const end = convertToMinutes(
            availability.end_time
        );

        const gap = parseInt(
            availability.slot_gap || 10
        );

        for (
            let current = start;
            current + duration <= end;
            current += gap
        ) {
            const slotStart = current;
            const slotEnd = current + duration;

            // =================================
            // Hide Past Time Slots of Today
            // Example Current time 5:24 PM
            // then 5:00 PM hide
            // =================================
            if (
                date === todayDate &&
                slotStart <= currentMinutes
            ) {
                continue;
            }

            let booked = false;

            for (const booking of bookings) {
                const bookedStart = convertToMinutes(
                    booking.start_time
                );

                const bookedEnd = convertToMinutes(
                    booking.end_time
                );

                if (
                    slotStart < bookedEnd &&
                    slotEnd > bookedStart
                ) {
                    booked = true;
                    break;
                }
            }

            if (!booked) {
                slots.push({
                    start_time: formatMinutes(slotStart),
                    end_time: formatMinutes(slotEnd),
                    label:
                        format12Hour(slotStart) +
                        " - " +
                        format12Hour(slotEnd)
                });
            }
        }

        return res.status(200).json({
            success: true,
            mentor_id: mentorId,
            date,
            duration_minutes: duration,
            total_slots: slots.length,
            slots
        });

    } catch (error) {
        console.log("Slot Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch slots"
        });
    }
};


// =====================================================
// HELPERS
// =====================================================

function convertToMinutes(time) {
    const [h, m, s] = time.split(":").map(Number);
    return h * 60 + m;
}

function formatMinutes(total) {
    const h = Math.floor(total / 60)
        .toString()
        .padStart(2, "0");

    const m = (total % 60)
        .toString()
        .padStart(2, "0");

    return `${h}:${m}:00`;
}

function format12Hour(total) {
    let h = Math.floor(total / 60);
    let m = total % 60;

    let ampm = h >= 12 ? "PM" : "AM";

    h = h % 12;
    if (h === 0) h = 12;

    return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}
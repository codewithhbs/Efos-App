const axios = require("axios");
const getPool = require("../config/db");
const pool = getPool();

// ══════════════════════════════════════════
// POST /create-order
// ══════════════════════════════════════════


exports.createOrder = async (req, res) => {
    try {
        const {
            userId,
            courseId,
            customer_name,
            customer_email,
            customer_phone,
            couponCode,
        } = req.body;

        // =================================
        // VALIDATION
        // =================================
        if (
            !userId ||
            !courseId ||
            !customer_name ||
            !customer_email ||
            !customer_phone
        ) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing.",
            });
        }

        // =================================
        // COURSE
        // =================================
        const [courseRows] = await pool.query(
            `SELECT * FROM learning_courses
       WHERE id=? AND status=1
       LIMIT 1`,
            [courseId]
        );

        if (courseRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        const course = courseRows[0];

        // =================================
        // PRICE
        // =================================
        let amount = 0;

        if (Number(course.is_free) === 1) {
            amount = 0;
        } else if (
            Number(course.has_discount) === 1 &&
            course.discount_price
        ) {
            amount = Number(course.discount_price);
        } else {
            amount = Number(course.price);
        }

        let originalAmount = amount;
        let discountAmount = 0;
        let appliedCoupon = null;

        // =================================
        // CHECK EXISTING BUY ROW
        // =================================
        const [existingRows] = await pool.query(
            `SELECT id,payment_status
       FROM course_buys
       WHERE user_id=? AND learning_course_id=?
       LIMIT 1`,
            [userId, courseId]
        );

        // =================================
        // FREE COURSE DIRECT ENTRY
        // =================================
        if (amount <= 0) {
            if (existingRows.length > 0) {
                const row = existingRows[0];

                if (row.payment_status === "success") {
                    return res.status(400).json({
                        success: false,
                        message:
                            "You already enrolled in this course.",
                    });
                }

                await pool.query(
                    `UPDATE course_buys
           SET type='free',
               amount=0,
               discount_amount=0,
               coupon_code=NULL,
               payment_status='success',
               transaction_id=NULL,
               payment_gateway='free',
               is_active=1,
               purchased_at=NOW(),
               updated_at=NOW()
           WHERE id=?`,
                    [row.id]
                );
            } else {
                await pool.query(
                    `INSERT INTO course_buys
          (
            user_id,
            learning_course_id,
            type,
            amount,
            discount_amount,
            coupon_code,
            payment_status,
            transaction_id,
            payment_gateway,
            is_active,
            purchased_at,
            created_at,
            updated_at
          )
          VALUES
          (?, ?, 'free', 0, 0, NULL,
           'success', NULL, 'free',
           1, NOW(), NOW(), NOW())`,
                    [userId, courseId]
                );
            }

            return res.status(200).json({
                success: true,
                message:
                    "Free course enrolled successfully.",
                data: {
                    isFree: true,
                },
            });
        }

        // =================================
        // PAID COURSE FLOW
        // =================================
        const order_id = generateOrderId();

        if (existingRows.length > 0) {
            const existing = existingRows[0];

            if (existing.payment_status === "success") {
                return res.status(400).json({
                    success: false,
                    message: "Already purchased.",
                });
            }

            await pool.query(
                `UPDATE course_buys
         SET type='paid',
             amount=?,
             discount_amount=?,
             coupon_code=?,
             payment_status='pending',
             transaction_id=?,
             payment_gateway='cashfree',
             is_active=0,
             updated_at=NOW()
         WHERE id=?`,
                [
                    amount,
                    discountAmount,
                    appliedCoupon,
                    order_id,
                    existing.id,
                ]
            );
        } else {
            await pool.query(
                `INSERT INTO course_buys
        (
          user_id,
          learning_course_id,
          type,
          amount,
          discount_amount,
          coupon_code,
          payment_status,
          transaction_id,
          payment_gateway,
          is_active,
          created_at,
          updated_at
        )
        VALUES
        (?, ?, 'paid', ?, ?, ?, 'pending',
         ?, 'cashfree', 0, NOW(), NOW())`,
                [
                    userId,
                    courseId,
                    amount,
                    discountAmount,
                    appliedCoupon,
                    order_id,
                ]
            );
        }

        // =================================
        // CASHFREE ORDER
        // =================================
        return await initiateCashfreeOrder({
            res,
            course,
            userId,
            customer_name,
            customer_email,
            customer_phone,
            amount,
            order_id,
            discountAmount,
            appliedCoupon,
            originalAmount,
        });
    } catch (error) {
        console.log(
            "Create Order Error =>",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to create order",
        });
    }
};
// ══════════════════════════════════════════
// POST /verify-payment
// body: { order_id, userId }
// ══════════════════════════════════════════
exports.verifyPayment = async (req, res) => {
    try {
        const { order_id, userId } = req.body;

        if (!order_id || !userId) {
            return res.status(400).json({
                success: false,
                message: "Order ID and User ID are required.",
            });
        }

        // Fetch local order
        const [orderRows] = await pool.query(
            `SELECT * FROM course_buys
             WHERE transaction_id = ? AND user_id = ? LIMIT 1`,
            [order_id, userId]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found. Please contact support.",
            });
        }

        const order = orderRows[0];

        // Already success — skip Cashfree call
        if (order.payment_status === "success") {
            return res.status(200).json({
                success: true,
                message: "Payment already verified. You can access your course now.",
                data: { status: "success", alreadyVerified: true },
            });
        }

        // Call Cashfree
        const APP_ID = process.env.CASHFREE_API_KEY;
        const SECRET_KEY = process.env.CASHFREE_API_SECRET;
        const MODE = process.env.CASHFREE_MODE;

        const BASE_URL =
            MODE === "production"
                ? "https://api.cashfree.com/pg"
                : "https://sandbox.cashfree.com/pg";

        const cfResponse = await axios.get(
            `${BASE_URL}/orders/${order_id}/payments`,
            {
                headers: {
                    accept: "application/json",
                    "x-client-id": APP_ID,
                    "x-client-secret": SECRET_KEY,
                    "x-api-version": "2023-08-01",
                },
            }
        );

        const payments = cfResponse.data;

        if (!payments || payments.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No payment attempt found for this order.",
                data: { status: "pending" },
            });
        }

        const latest = payments[payments.length - 1];
        const cfStatus = latest?.payment_status?.toLowerCase();

        // ── SUCCESS ──
        if (cfStatus === "success") {
            await pool.query(
                `UPDATE course_buys
                 SET payment_status = 'success',
                     is_active      = 1,
                     purchased_at   = NOW(),
                     updated_at     = NOW()
                 WHERE transaction_id = ? AND user_id = ?`,
                [order_id, userId]
            );

            return res.status(200).json({
                success: true,
                message: "Payment successful! You are now enrolled in the course.",
                data: { status: "success", amount: latest.order_amount },
            });
        }

        // ── FAILED ──
        if (cfStatus === "failed") {
            await pool.query(
                `UPDATE course_buys
                 SET payment_status = 'failed', updated_at = NOW()
                 WHERE transaction_id = ? AND user_id = ?`,
                [order_id, userId]
            );

            return res.status(200).json({
                success: false,
                message: "Payment failed. Please try again or use a different payment method.",
                data: { status: "failed" },
            });
        }

        // ── USER DROPPED / CANCELLED ──
        if (cfStatus === "user_dropped" || cfStatus === "cancelled") {
            await pool.query(
                `UPDATE course_buys
                 SET payment_status = 'failed', updated_at = NOW()
                 WHERE transaction_id = ? AND user_id = ?`,
                [order_id, userId]
            );

            return res.status(200).json({
                success: false,
                message: "Payment was cancelled. You can retry anytime.",
                data: { status: "cancelled" },
            });
        }

        // ── PENDING ──
        return res.status(200).json({
            success: false,
            message: "Payment is still being processed. Please wait and check again.",
            data: { status: "pending" },
        });

    } catch (error) {
        console.error("verifyPayment Error =>", error?.response?.data || error.message);

        if (error?.response?.status === 404) {
            return res.status(404).json({
                success: false,
                message: "Order not found on payment gateway. Please contact support.",
            });
        }

        if (error?.response?.status === 401) {
            return res.status(500).json({
                success: false,
                message: "Payment gateway authentication failed. Please contact support.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to verify payment at this time. Please try again or contact support.",
            ...(process.env.NODE_ENV === "development" && {
                debug: error?.response?.data || error.message,
            }),
        });
    }
};

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════

function generateOrderId() {
    return "COURSE_" + Date.now() + "_" + Math.floor(Math.random() * 99999);
}

async function initiateCashfreeOrder({
    res, course, userId,
    customer_name, customer_email, customer_phone,
    amount, order_id,
}) {
    const APP_ID = process.env.CASHFREE_API_KEY;
    const SECRET_KEY = process.env.CASHFREE_API_SECRET;
    const CASHFREE_URL = process.env.CASHFREE_URL;
    const MODE = process.env.CASHFREE_MODE;

    if (!APP_ID || !SECRET_KEY || !CASHFREE_URL) {
        return res.status(500).json({
            success: false,
            message: "Payment gateway is not configured. Please contact support.",
        });
    }

    const payload = {
        order_id,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
            customer_id: String(userId),
            customer_name,
            customer_email,
            customer_phone,
        },
        order_meta: {
            return_url: `https://yourdomain.com/payment-success?order_id={order_id}`,
        },
        order_note: "Course Purchase - " + course.title,
    };

    try {
        const response = await axios.post(CASHFREE_URL, payload, {
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                "x-client-id": APP_ID,
                "x-client-secret": SECRET_KEY,
                "x-api-version": "2023-08-01",
            },
        });

        return res.status(200).json({
            success: true,
            message: "Order created successfully. Proceed to payment.",
            data: {
                order_id: response.data.order_id,
                payment_session_id: response.data.payment_session_id,
                cf_order_id: response.data.cf_order_id,
                amount,
                environment: MODE === "production" ? "PRODUCTION" : "SANDBOX",
            },
        });

    } catch (cfError) {
        console.error("Cashfree API Error =>", cfError?.response?.data || cfError.message);

        const cfMsg = cfError?.response?.data?.message?.toLowerCase() || "";

        let friendlyMsg = "Payment gateway error. Please try again.";
        if (cfMsg.includes("invalid")) friendlyMsg = "Payment details are invalid. Please check and retry.";
        if (cfMsg.includes("unauthorized") ||
            cfMsg.includes("authentication")) friendlyMsg = "Payment gateway authentication failed. Please contact support.";
        if (cfMsg.includes("duplicate")) friendlyMsg = "Duplicate payment request detected. Please wait a moment and retry.";

        return res.status(502).json({
            success: false,
            message: friendlyMsg,
            ...(process.env.NODE_ENV === "development" && {
                debug: cfError?.response?.data,
            }),
        });
    }
}


exports.getAvailableCoupon = async (req, res) => {
    try {
        const userId = req.user.id;

        // ==========================
        // USER ORDERS CHECK
        // ==========================
        const [orders] = await pool.query(
            `SELECT COUNT(*) AS totalOrders
       FROM course_buys
       WHERE user_id = ?
       AND payment_status = 'success'`,
            [userId]
        );

        const totalOrders = Number(orders[0].totalOrders);

        // ==========================
        // ACTIVE COUPONS
        // ==========================
        const [coupons] = await pool.query(
            `SELECT *
       FROM coupons
       WHERE status = 'active'
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (expires_at IS NULL OR expires_at >= NOW())
       ORDER BY id DESC`
        );

        const finalCoupons = [];

        for (const coupon of coupons) {
            let valid = true;
            let reason = "Available";

            // ==========================
            // EXPIRED
            // ==========================
            if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
                valid = false;
                reason = "Expired";
            }

            // ==========================
            // USAGE LIMIT
            // ==========================
            if (
                coupon.usage_limit &&
                Number(coupon.used_count) >= Number(coupon.usage_limit)
            ) {
                valid = false;
                reason = "Coupon limit reached";
            }

            // ==========================
            // FIRST ORDER ONLY
            // ==========================
            if (
                Number(coupon.first_order_only) === 1 &&
                totalOrders > 0
            ) {
                valid = false;
                reason = "Only for first purchase";
            }

            // ==========================
            // USER TYPE
            // ==========================
            if (
                coupon.user_type === "new_user" &&
                totalOrders > 0
            ) {
                valid = false;
                reason = "Only for new users";
            }

            if (
                coupon.user_type === "existing_user" &&
                totalOrders === 0
            ) {
                valid = false;
                reason = "Only for existing users";
            }

            // ==========================
            // PER USER LIMIT
            // ==========================
            const [usedByUser] = await pool.query(
                `SELECT COUNT(*) AS totalUsed
         FROM coupon_usages
         WHERE user_id = ?
         AND coupon_id = ?`,
                [userId, coupon.id]
            );

            if (
                Number(usedByUser[0].totalUsed) >=
                Number(coupon.per_user_limit)
            ) {
                valid = false;
                reason = "Already used maximum times";
            }

            finalCoupons.push({
                id: coupon.id,
                code: coupon.code,
                title: coupon.title,
                description: coupon.description,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
                max_discount_amount: coupon.max_discount_amount,
                min_order_amount: coupon.min_order_amount,
                valid,
                reason,
                expires_at: coupon.expires_at,
            });
        }

        return res.status(200).json({
            success: true,
            data: finalCoupons,
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch coupons",
        });
    }
};

// ======================================
// APPLY COUPON API 
// ======================================

exports.applyCoupon = async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId, couponCode } = req.body;

        // ==========================
        // VALIDATION
        // ==========================
        if (!courseId || !couponCode) {
            return res.status(400).json({
                success: false,
                message: "Course and coupon code required",
            });
        }

        // ==========================
        // COURSE CHECK
        // ==========================
        const [courseRows] = await pool.query(
            `SELECT * FROM learning_courses
       WHERE id=? AND status=1
       LIMIT 1`,
            [courseId]
        );

        if (courseRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        const course = courseRows[0];

        // ==========================
        // PRICE
        // ==========================
        let originalAmount = 0;

        if (Number(course.is_free) === 1) {
            originalAmount = 0;
        } else if (
            Number(course.has_discount) === 1 &&
            course.discount_price
        ) {
            originalAmount = Number(course.discount_price);
        } else {
            originalAmount = Number(course.price);
        }

        if (originalAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Coupon not applicable on free course",
            });
        }

        // ==========================
        // COUPON CHECK
        // ==========================
        const [couponRows] = await pool.query(
            `SELECT * FROM coupons
       WHERE code=?
       AND status='active'
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (expires_at IS NULL OR expires_at >= NOW())
       LIMIT 1`,
            [couponCode.trim().toUpperCase()]
        );

        if (couponRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired coupon",
            });
        }

        const coupon = couponRows[0];

        // ==========================
        // MIN ORDER
        // ==========================
        if (
            originalAmount <
            Number(coupon.min_order_amount)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Minimum order ₹" +
                    coupon.min_order_amount +
                    " required",
            });
        }

        // ==========================
        // TOTAL LIMIT
        // ==========================
        if (
            coupon.usage_limit &&
            Number(coupon.used_count) >=
            Number(coupon.usage_limit)
        ) {
            return res.status(400).json({
                success: false,
                message: "Coupon fully used",
            });
        }

        // ==========================
        // USER PURCHASE HISTORY
        // ==========================
        const [orders] = await pool.query(
            `SELECT COUNT(*) AS total
       FROM course_buys
       WHERE user_id=?
       AND payment_status='success'`,
            [userId]
        );

        const totalOrders = Number(orders[0].total);

        // ==========================
        // FIRST ORDER ONLY
        // ==========================
        if (
            Number(coupon.first_order_only) === 1 &&
            totalOrders > 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Coupon valid only on first order",
            });
        }

        // ==========================
        // USER TYPE
        // ==========================
        if (
            coupon.user_type === "new_user" &&
            totalOrders > 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Coupon valid only for new users",
            });
        }

        if (
            coupon.user_type ===
            "existing_user" &&
            totalOrders === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Coupon valid only for existing users",
            });
        }

        // ==========================
        // PER USER LIMIT
        // ==========================
        const [usedRows] = await pool.query(
            `SELECT COUNT(*) AS totalUsed
       FROM coupon_usages
       WHERE user_id=?
       AND coupon_id=?`,
            [userId, coupon.id]
        );

        if (
            Number(usedRows[0].totalUsed) >=
            Number(coupon.per_user_limit)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Coupon usage limit reached",
            });
        }

        // ==========================
        // DISCOUNT CALCULATE
        // ==========================
        let discount = 0;

        if (
            coupon.discount_type === "flat"
        ) {
            discount = Number(
                coupon.discount_value
            );
        } else {
            discount =
                (originalAmount *
                    Number(
                        coupon.discount_value
                    )) /
                100;

            if (
                coupon.max_discount_amount &&
                discount >
                Number(
                    coupon.max_discount_amount
                )
            ) {
                discount = Number(
                    coupon.max_discount_amount
                );
            }
        }

        let finalAmount =
            originalAmount - discount;

        if (finalAmount < 1)
            finalAmount = 1;

        // ==========================
        // RESPONSE
        // ==========================
        return res.status(200).json({
            success: true,
            message: "Coupon applied successfully",
            data: {
                coupon_id: coupon.id,
                coupon_code: coupon.code,
                title: coupon.title,
                discount_type:
                    coupon.discount_type,
                discount_value:
                    coupon.discount_value,
                originalAmount,
                discountAmount: Number(
                    discount.toFixed(2)
                ),
                finalAmount: Number(
                    finalAmount.toFixed(2)
                ),
                saved: Number(
                    discount.toFixed(2)
                ),
            },
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Unable to apply coupon",
        });
    }
};



exports.getAllMyEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user.id;
        const baseUrl = process.env.APP_API_URL || "";

        // ======================================
        // Query Params
        // ======================================
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status =
            req.query.payment_status || "success";
        const search =
            req.query.search?.trim() || "";

        const offset = (page - 1) * limit;

        // ======================================
        // Dynamic Where Clause
        // ======================================
        let whereClause = `
      WHERE cb.user_id = ?
      AND lc.status = 1
    `;

        let params = [userId];

        if (status !== "all") {
            whereClause +=
                ` AND cb.payment_status = ?`;
            params.push(status);
        }

        if (search) {
            whereClause += `
        AND (
          lc.title LIKE ?
          OR lc.slug LIKE ?
        )
      `;
            params.push(
                `%${search}%`,
                `%${search}%`
            );
        }

        // ======================================
        // Total Count
        // ======================================
        const [countRows] = await pool.query(
            `
      SELECT COUNT(*) AS total
      FROM course_buys cb
      JOIN learning_courses lc
        ON cb.learning_course_id = lc.id
      ${whereClause}
      `,
            params
        );

        const total = countRows[0].total;
        const totalPages = Math.ceil(
            total / limit
        );

        // ======================================
        // Main Data
        // ======================================
        const [rows] = await pool.query(
            `
      SELECT 
        cb.id AS buy_id,
        cb.amount,
        cb.discount_amount,
        cb.coupon_code,
        cb.payment_status,
        cb.purchased_at,

        lc.id AS course_id,
        lc.title,
        lc.slug,
        lc.thumbnail

      FROM course_buys cb
      JOIN learning_courses lc
        ON cb.learning_course_id = lc.id

      ${whereClause}

      ORDER BY cb.purchased_at DESC
      LIMIT ? OFFSET ?
      `,
            [...params, limit, offset]
        );

        // ======================================
        // Format Thumbnail
        // ======================================
        const courses = rows.map(item => ({
            ...item,
            thumbnail: item.thumbnail
                ? `${baseUrl}/${item.thumbnail}`
                : null
        }));

        return res.status(200).json({
            success: true,
            message:
                "Enrolled courses fetched successfully",

            page,
            limit,
            total,
            totalPages,
            count: courses.length,

            filters: {
                payment_status: status,
                search
            },

            data: courses
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message:
                "Unable to fetch enrolled courses at this time."
        });
    }
};


exports.getMyAllMentorSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const baseUrl = process.env.APP_API_URL || "";

        // =====================================
        // Query Params
        // =====================================
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const status =
            req.query.status?.trim() || "all";

        const payment_status =
            req.query.payment_status?.trim() ||
            "all";

        const search =
            req.query.search?.trim() || "";

        const offset = (page - 1) * limit;

        // =====================================
        // Get Student Profile
        // =====================================
        const [[student]] = await pool.query(
            `SELECT id
       FROM students
       WHERE user_id = ?
       LIMIT 1`,
            [userId]
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message:
                    "Student profile not found."
            });
        }

        // =====================================
        // Where Clause
        // =====================================
        let whereClause = `
      WHERE sb.student_id = ?
    `;

        let params = [student.id];

        if (status !== "all") {
            whereClause +=
                ` AND sb.status = ?`;
            params.push(status);
        }

        if (payment_status !== "all") {
            whereClause +=
                ` AND sb.payment_status = ?`;
            params.push(payment_status);
        }

        if (search) {
            whereClause += `
        AND (
          mp.name LIKE ?
          OR sb.transaction_id LIKE ?
          OR sb.meeting_platform LIKE ?
        )
      `;

            params.push(
                `%${search}%`,
                `%${search}%`,
                `%${search}%`
            );
        }

        // =====================================
        // Total Count
        // =====================================
        const [countRows] = await pool.query(
            `
      SELECT COUNT(*) AS total
      FROM session_bookings sb
      JOIN mentor_profiles mp
        ON mp.id = sb.mentor_id
      ${whereClause}
      `,
            params
        );

        const total = countRows[0].total;
        const totalPages = Math.ceil(
            total / limit
        );

        // =====================================
        // Main Query
        // =====================================
        const [rows] = await pool.query(
            `
      SELECT
        sb.id,
        sb.transaction_id,
        sb.session_date,
        sb.start_time,
        sb.end_time,
        sb.duration_minutes,
        sb.price,
        sb.discount_price,
        sb.final_price,
        sb.payment_status,
        sb.payment_gateway,
        sb.meeting_platform,
        sb.zoom_meeting_id,
        sb.zoom_join_url,
        sb.zoom_start_url,
        sb.zoom_password,
        sb.status,
        sb.created_at,

        mp.id AS mentor_id,
        mp.name AS mentor_name,
        mp.profile_photo AS mentor_photo,
        mp.slug AS mentor_slug,

        msp.session_type

      FROM session_bookings sb

      JOIN mentor_profiles mp
        ON mp.id = sb.mentor_id

      LEFT JOIN mentor_session_prices msp
        ON msp.id = sb.session_price_id

      ${whereClause}

      ORDER BY sb.created_at DESC
      LIMIT ? OFFSET ?
      `,
            [...params, limit, offset]
        );

        // =====================================
        // Format Image URL
        // =====================================
        const sessions = rows.map(item => ({
            ...item,
            mentor_photo: item.mentor_photo
                ? `${baseUrl}/${item.mentor_photo}`
                : null
        }));

        // =====================================
        // Response
        // =====================================
        return res.status(200).json({
            success: true,
            message:
                "Mentor sessions fetched successfully",

            page,
            limit,
            total,
            totalPages,
            count: sessions.length,

            filters: {
                status,
                payment_status,
                search
            },

            data: sessions
        });

    } catch (error) {
        console.log(
            "Get Mentor Sessions Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to fetch mentor sessions at this time."
        });
    }
};


exports.getMyAllApplications = async (req, res) => {
    try {
        const userId = req.user.id;

        // =====================================
        // Query Params
        // =====================================
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const status =
            req.query.status?.trim() || "all";

        const search =
            req.query.search?.trim() || "";

        const offset = (page - 1) * limit;

        // =====================================
        // Get Student Profile
        // =====================================
        const [[student]] = await pool.query(
            `SELECT id
       FROM students
       WHERE user_id = ?
       LIMIT 1`,
            [userId]
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message:
                    "Student profile not found."
            });
        }

        // =====================================
        // Where Clause
        // =====================================
        let whereClause = `
      WHERE ja.student_id = ?
    `;

        let params = [student.id];

        if (status !== "all") {
            whereClause += `
        AND ja.status = ?
      `;
            params.push(status);
        }

        if (search) {
            whereClause += `
        AND (
          ja.job_title LIKE ?
          OR ja.company_name LIKE ?
          OR ja.district LIKE ?
          OR ja.state LIKE ?
          OR CAST(ja.job_id AS CHAR) LIKE ?
        )
      `;

            params.push(
                `%${search}%`,
                `%${search}%`,
                `%${search}%`,
                `%${search}%`,
                `%${search}%`
            );
        }

        // =====================================
        // Total Count
        // =====================================
        const [countRows] = await pool.query(
            `
      SELECT COUNT(*) AS total
      FROM job_applications ja
      ${whereClause}
      `,
            params
        );

        const total = countRows[0].total;
        const totalPages =
            Math.ceil(total / limit) || 1;

        // =====================================
        // Main Query
        // =====================================
        const [rows] = await pool.query(
            `
      SELECT
        ja.id,
        ja.job_id,
        ja.job_title,
        ja.company_name,
        ja.district,
        ja.state,
        ja.status,
        ja.applied_at,
        ja.created_at,
        ja.updated_at,

        jp.slug,
        jp.salary,
        jp.job_type,
        jp.work_mode,
        jp.shift,
        jp.experience,
        jp.education,
        jp.age_limit,
        jp.gender,
        jp.skills,
        jp.short_description,
        jp.is_featured

      FROM job_applications ja

      LEFT JOIN jobs jp
        ON jp.id = ja.job_id

      ${whereClause}

      ORDER BY ja.applied_at DESC
      LIMIT ? OFFSET ?
      `,
            [...params, limit, offset]
        );

        // =====================================
        // Response
        // =====================================
        return res.status(200).json({
            success: true,
            message:
                "Your applications fetched successfully",

            page,
            limit,
            total,
            totalPages,
            count: rows.length,

            filters: {
                status,
                search
            },

            data: rows
        });

    } catch (error) {
        console.log(
            "Get My Applications Error =>",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to fetch your applications at this time."
        });
    }
};

exports.getAllMyPayments = async (req, res) => {
    try {
        const userId = req.user.id;
        const baseUrl = process.env.APP_API_URL || "";

        // =====================================
        // Query Params
        // =====================================
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const type =
            req.query.type?.trim() || "all";
        // all | course | session

        const payment_status =
            req.query.payment_status?.trim() ||
            "all";

        const search =
            req.query.search?.trim() || "";

        const offset = (page - 1) * limit;

        let payments = [];

        // =====================================
        // COURSE PAYMENTS
        // =====================================
        if (type === "all" || type === "course") {
            let whereCourse = `
        WHERE cb.user_id = ?
      `;

            let courseParams = [userId];

            if (payment_status !== "all") {
                whereCourse += `
          AND cb.payment_status = ?
        `;
                courseParams.push(payment_status);
            }

            if (search) {
                whereCourse += `
          AND (
            lc.title LIKE ?
            OR cb.coupon_code LIKE ?
          )
        `;

                courseParams.push(
                    `%${search}%`,
                    `%${search}%`
                );
            }

            const [courseRows] = await pool.query(
                `
        SELECT
          cb.id,
          'course' AS payment_type,
          cb.amount,
          cb.discount_amount,
          cb.payment_status,
          cb.coupon_code,
          cb.purchased_at AS paid_at,
          lc.title,
          lc.slug,
          lc.thumbnail
        FROM course_buys cb
        JOIN learning_courses lc
          ON lc.id = cb.learning_course_id
        ${whereCourse}
        `,
                courseParams
            );

            payments.push(
                ...courseRows.map(item => ({
                    ...item,
                    thumbnail: item.thumbnail
                        ? `${baseUrl}/${item.thumbnail}`
                        : null
                }))
            );
        }

        // =====================================
        // SESSION PAYMENTS
        // =====================================
        if (type === "all" || type === "session") {
            const [[student]] = await pool.query(
                `SELECT id
         FROM students
         WHERE user_id = ?
         LIMIT 1`,
                [userId]
            );

            if (student) {
                let whereSession = `
          WHERE sb.student_id = ?
        `;

                let sessionParams = [student.id];

                if (payment_status !== "all") {
                    whereSession += `
            AND sb.payment_status = ?
          `;
                    sessionParams.push(
                        payment_status
                    );
                }

                if (search) {
                    whereSession += `
            AND (
              mp.name LIKE ?
              OR sb.transaction_id LIKE ?
            )
          `;

                    sessionParams.push(
                        `%${search}%`,
                        `%${search}%`
                    );
                }

                const [sessionRows] =
                    await pool.query(
                        `
          SELECT
            sb.id,
            'session' AS payment_type,
            sb.final_price AS amount,
            sb.discount_price,
            sb.payment_status,
            sb.transaction_id,
            sb.created_at AS paid_at,

            mp.name AS title,
            mp.slug,
            mp.profile_photo AS thumbnail

          FROM session_bookings sb
          JOIN mentor_profiles mp
            ON mp.id = sb.mentor_id

          ${whereSession}
          `,
                        sessionParams
                    );

                payments.push(
                    ...sessionRows.map(
                        item => ({
                            ...item,
                            thumbnail:
                                item.thumbnail
                                    ? `${baseUrl}/${item.thumbnail}`
                                    : null
                        })
                    )
                );
            }
        }

        // =====================================
        // Sort Latest First
        // =====================================
        payments.sort(
            (a, b) =>
                new Date(b.paid_at) -
                new Date(a.paid_at)
        );

        // =====================================
        // Pagination
        // =====================================
        const total = payments.length;
        const totalPages =
            Math.ceil(total / limit) || 1;

        const paginated =
            payments.slice(
                offset,
                offset + limit
            );

        // =====================================
        // Response
        // =====================================
        return res.status(200).json({
            success: true,
            message:
                "Payments fetched successfully",

            page,
            limit,
            total,
            totalPages,
            count: paginated.length,

            filters: {
                type,
                payment_status,
                search
            },

            data: paginated
        });

    } catch (error) {
        console.log(
            "Get Payments Error =>",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to fetch payments at this time."
        });
    }
};


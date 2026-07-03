const getPool = require("../config/db");
const pool = getPool();

const cashfree = require("../utils/cashfreeClient");

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════

function generateOrderId() {
    return "BUNDLE_" + Date.now() + "_" + Math.floor(Math.random() * 99999);
}

function computeBundleAmount(bundle) {
    if (Number(bundle.is_free) === 1) return 0;

    if (Number(bundle.has_discount) === 1 && bundle.discount_price !== null) {
        return Number(bundle.discount_price);
    }

    return Number(bundle.price);
}

/**
 * The "main" bundle row in course_buys — learning_course_id IS NULL,
 * bundle_id set. This one row represents the whole bundle purchase;
 * the per-course rows (type='bundle_course') fan out from it.
 */
async function getBundlePurchaseRow(connection, userId, bundleId) {
    const [[row]] = await connection.query(
        `SELECT *
         FROM course_buys
         WHERE user_id = ?
           AND bundle_id = ?
           AND learning_course_id IS NULL
         ORDER BY id DESC
         LIMIT 1`,
        [userId, bundleId]
    );

    return row || null;
}

/**
 * Inserts the per-course rows for a bundle, skipping any that already
 * exist for this user+bundle (retry / webhook-then-poll safety net).
 */
async function insertBundleCourses(connection, {
    userId,
    bundleId,
    couponCode,
    transactionId,
    paymentGateway,
}) {
    const [courses] = await connection.query(
        `SELECT course_id FROM bundle_courses WHERE bundle_id = ?`,
        [bundleId]
    );

    if (courses.length === 0) return;

    const [existing] = await connection.query(
        `SELECT learning_course_id
         FROM course_buys
         WHERE user_id = ? AND bundle_id = ? AND type = 'bundle_course'`,
        [userId, bundleId]
    );

    const already = new Set(existing.map((r) => r.learning_course_id));
    const remaining = courses.filter((c) => !already.has(c.course_id));

    if (remaining.length === 0) return;

    const values = remaining.map((course) => [
        userId,
        course.course_id,
        bundleId,
        "bundle_course",
        0,
        0,
        couponCode,
        "success",
        transactionId,
        paymentGateway,
        1,
        0,
        new Date(),
        new Date(),
        new Date(),
    ]);

    await connection.query(
        `INSERT INTO course_buys
        (
            user_id, learning_course_id, bundle_id, type, amount,
            discount_amount, coupon_code, payment_status, transaction_id,
            payment_gateway, is_active, is_refunded, purchased_at,
            created_at, updated_at
        )
        VALUES ?`,
        [values]
    );
}

// ══════════════════════════════════════════
// POST /bundles/:bundleId/init-payment
// body: { customer_name, customer_email, customer_phone, coupon_code? }
// ══════════════════════════════════════════
exports.initBundlePayment = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const userId = req.user.id;
        const { bundleId } = req.params;
        const { customer_name, customer_email, customer_phone } = req.body;
        const coupon_code = req.body.coupon_code || null;

        if (!bundleId) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: "Bundle id is required.",
            });
        }

        await connection.beginTransaction();

        // ── Bundle ──
        const [[bundle]] = await connection.query(
            `SELECT * FROM course_bundles WHERE id = ? AND status = 1 LIMIT 1`,
            [bundleId]
        );

        if (!bundle) {
            await connection.rollback();
            connection.release();

            return res.status(404).json({
                success: false,
                message: "Bundle not found.",
            });
        }

        // ── Existing row for this user+bundle (pending retry or success) ──
        const existing = await getBundlePurchaseRow(connection, userId, bundleId);

        if (existing && existing.payment_status === "success") {
            await connection.rollback();
            connection.release();

            return res.status(409).json({
                success: false,
                message: "Bundle already purchased.",
            });
        }

        const amount = computeBundleAmount(bundle);

        // ══════════════════════════════════
        // FREE BUNDLE — enroll immediately
        // ══════════════════════════════════
        if (amount <= 0) {
            if (existing) {
                await connection.query(
                    `UPDATE course_buys
                     SET type = 'bundle_free',
                         amount = 0,
                         discount_amount = 0,
                         coupon_code = NULL,
                         payment_status = 'success',
                         transaction_id = NULL,
                         payment_gateway = 'free',
                         is_active = 1,
                         purchased_at = NOW(),
                         updated_at = NOW()
                     WHERE id = ?`,
                    [existing.id]
                );
            } else {
                await connection.query(
                    `INSERT INTO course_buys
                    (
                        user_id, learning_course_id, bundle_id, type, amount,
                        discount_amount, coupon_code, payment_status,
                        transaction_id, payment_gateway, is_active, is_refunded,
                        purchased_at, created_at, updated_at
                    )
                    VALUES (?, NULL, ?, 'bundle_free', 0, 0, NULL, 'success',
                            NULL, 'free', 1, 0, NOW(), NOW(), NOW())`,
                    [userId, bundleId]
                );
            }

            await insertBundleCourses(connection, {
                userId,
                bundleId,
                couponCode: null,
                transactionId: null,
                paymentGateway: "free",
            });

            await connection.commit();
            connection.release();

            return res.status(200).json({
                success: true,
                message: "Free bundle activated successfully.",
                data: { isFree: true },
            });
        }

        // ══════════════════════════════════
        // PAID BUNDLE — create Cashfree order
        // ══════════════════════════════════
        if (!customer_name || !customer_email || !customer_phone) {
            await connection.rollback();
            connection.release();

            return res.status(400).json({
                success: false,
                message:
                    "customer_name, customer_email and customer_phone are required for paid bundles.",
            });
        }

        if (!cashfree.isConfigured()) {
            await connection.rollback();
            connection.release();

            return res.status(500).json({
                success: false,
                message: "Payment gateway is not configured. Please contact support.",
            });
        }

        const order_id = generateOrderId();

        // Reserve/refresh the pending row BEFORE calling Cashfree so a crash
        // mid-call never leaves an order at Cashfree with no local trace.
        if (existing) {
            await connection.query(
                `UPDATE course_buys
                 SET type = 'paid',
                     amount = ?,
                     discount_amount = 0,
                     coupon_code = ?,
                     payment_status = 'pending',
                     transaction_id = ?,
                     payment_gateway = 'cashfree',
                     is_active = 0,
                     updated_at = NOW()
                 WHERE id = ?`,
                [amount, coupon_code, order_id, existing.id]
            );
        } else {
            await connection.query(
                `INSERT INTO course_buys
                (
                    user_id, learning_course_id, bundle_id, type, amount,
                    discount_amount, coupon_code, payment_status,
                    transaction_id, payment_gateway, is_active, is_refunded,
                    created_at, updated_at
                )
                VALUES (?, NULL, ?, 'paid', ?, 0, ?, 'pending', ?, 'cashfree',
                        0, 0, NOW(), NOW())`,
                [userId, bundleId, amount, coupon_code, order_id]
            );
        }

        let cfOrder;

        try {
            cfOrder = await cashfree.createOrder({
                order_id,
                order_amount: amount,
                customer_id: userId,
                customer_name,
                customer_email,
                customer_phone,
                order_note: "Bundle Purchase - " + bundle.title,
            });
        } catch (cfError) {
            // Cashfree call failed — mark the row failed so it doesn't stay
            // stuck 'pending', then bail. Runs outside the rolled-back
            // transaction so the FAILED status persists.
            await pool.query(
                `UPDATE course_buys
                 SET payment_status = 'failed', updated_at = NOW()
                 WHERE transaction_id = ? AND user_id = ?`,
                [order_id, userId]
            );

            await connection.rollback();
            connection.release();

            console.error(
                "[initBundlePayment] Cashfree error =>",
                cfError?.response?.data || cfError.message
            );

            return res.status(502).json({
                success: false,
                message: cashfree.friendlyErrorMessage(cfError),
            });
        }

        await connection.commit();
        connection.release();

        return res.status(200).json({
            success: true,
            message: "Order created successfully. Proceed to payment.",
            data: {
                order_id: cfOrder.order_id,
                payment_session_id: cfOrder.payment_session_id,
                cf_order_id: cfOrder.cf_order_id,
                environment: cfOrder.order_mode,
                amount,
            },
        });
    } catch (error) {
        await connection.rollback();
        connection.release();

        console.error("[initBundlePayment] Error =>", error);

        return res.status(500).json({
            success: false,
            message: "Unable to initiate bundle payment.",
        });
    }
};

// ══════════════════════════════════════════
// POST /bundles/verify-payment
// body: { order_id }
// ══════════════════════════════════════════
exports.verifyBundlePayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { order_id } = req.body;

        if (!order_id) {
            return res.status(400).json({
                success: false,
                message: "order_id is required.",
            });
        }

        const [[order]] = await pool.query(
            `SELECT *
             FROM course_buys
             WHERE transaction_id = ?
               AND user_id = ?
               AND learning_course_id IS NULL
             LIMIT 1`,
            [order_id, userId]
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found. Please contact support.",
            });
        }

        // Idempotent: already resolved, don't call Cashfree again.
        if (order.payment_status === "success") {
            return res.status(200).json({
                success: true,
                message: "Payment already verified. You can access your bundle now.",
                data: { status: "success", alreadyVerified: true },
            });
        }

        let latestPayment;

        try {
            latestPayment = await cashfree.getLatestPayment(order_id);
        } catch (cfError) {
            console.error(
                "[verifyBundlePayment] Cashfree error =>",
                cfError?.response?.data || cfError.message
            );

            if (cfError?.response?.status === 404) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found on payment gateway. Please contact support.",
                });
            }

            return res.status(500).json({
                success: false,
                message:
                    "Unable to verify payment at this time. Please try again or contact support.",
                ...(process.env.NODE_ENV === "development" && {
                    debug: cfError?.response?.data || cfError.message,
                }),
            });
        }

        if (!latestPayment) {
            return res.status(200).json({
                success: false,
                message: "No payment attempt found for this order.",
                data: { status: "pending" },
            });
        }

        const cfStatus = latestPayment?.payment_status?.toLowerCase();

        // ── SUCCESS ──
        if (cfStatus === "success") {
            const connection = await pool.getConnection();

            try {
                await connection.beginTransaction();

                // Re-check under lock — guards against a double verify call
                // (client retry + webhook, two tabs, etc.) racing each other.
                const [[freshRow]] = await connection.query(
                    `SELECT payment_status FROM course_buys WHERE id = ? FOR UPDATE`,
                    [order.id]
                );

                if (freshRow.payment_status === "success") {
                    await connection.commit();
                    connection.release();

                    return res.status(200).json({
                        success: true,
                        message: "Payment already verified. You can access your bundle now.",
                        data: { status: "success", alreadyVerified: true },
                    });
                }

                await connection.query(
                    `UPDATE course_buys
                     SET payment_status = 'success',
                         is_active = 1,
                         purchased_at = NOW(),
                         updated_at = NOW()
                     WHERE id = ?`,
                    [order.id]
                );

                await insertBundleCourses(connection, {
                    userId,
                    bundleId: order.bundle_id,
                    couponCode: order.coupon_code,
                    transactionId: order_id,
                    paymentGateway: "cashfree",
                });

                await connection.commit();
                connection.release();

                return res.status(200).json({
                    success: true,
                    message: "Payment successful! You are now enrolled in the bundle.",
                    data: { status: "success", amount: order.amount },
                });
            } catch (txError) {
                await connection.rollback();
                connection.release();

                console.error("[verifyBundlePayment] Transaction error =>", txError);

                return res.status(500).json({
                    success: false,
                    message: "Payment verified but enrollment failed. Please contact support.",
                });
            }
        }

        // ── FAILED ──
        if (cfStatus === "failed") {
            await pool.query(
                `UPDATE course_buys
                 SET payment_status = 'failed', updated_at = NOW()
                 WHERE id = ?`,
                [order.id]
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
                 WHERE id = ?`,
                [order.id]
            );

            return res.status(200).json({
                success: false,
                message: "Payment was cancelled. You can retry anytime.",
                data: { status: "cancelled" },
            });
        }

        // ── PENDING / anything else ──
        return res.status(200).json({
            success: false,
            message: "Payment is still being processed. Please wait and check again.",
            data: { status: "pending" },
        });
    } catch (error) {
        console.error("[verifyBundlePayment] Error =>", error);

        return res.status(500).json({
            success: false,
            message:
                "Unable to verify payment at this time. Please try again or contact support.",
        });
    }
};



// ══════════════════════════════════════════
// GET /bundles/:bundleId/purchase-status
// ══════════════════════════════════════════
exports.checkBundlePurchaseStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bundleId } = req.params;
        console.log("bundleId", bundleId);
        console.log("userId", userId);

        if (!bundleId) {
            return res.status(400).json({
                success: false,
                message: "Bundle id is required.",
            });
        }

        const [[row]] = await pool.query(
            `SELECT id, payment_status, purchased_at, transaction_id
             FROM course_buys
             WHERE user_id = ?
               AND bundle_id = ?
               AND learning_course_id IS NULL
             ORDER BY id DESC
             LIMIT 1`,
            [userId, bundleId]
        );

        // No row at all — never attempted a purchase.
        if (!row) {
            return res.status(200).json({
                success: true,
                data: {
                    purchased: false,
                    status: "none",
                },
            });
        }

        const purchased = row.payment_status === "success";

        return res.status(200).json({
            success: true,
            data: {
                purchased,
                status: row.payment_status, // 'pending' | 'success' | 'failed'
                purchased_at: row.purchased_at,
                transaction_id: row.transaction_id,
            },
        });
    } catch (error) {
        console.error("[checkBundlePurchaseStatus] Error =>", error);

        return res.status(500).json({
            success: false,
            message: "Unable to check bundle purchase status.",
        });
    }
};


exports.getAllMyBundlePurchases = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const bundleImageBaseUrl = "https://efos.in/public/";

        const [bundles] = await pool.query(
            `SELECT
                cb.id,
                cb.bundle_id,
                cb.payment_status,
                cb.purchased_at,
                cb.transaction_id,
                b.title,
                b.thumbnail
            FROM course_buys cb
            INNER JOIN course_bundles b
                ON cb.bundle_id = b.id
            WHERE cb.user_id = ?
              AND cb.learning_course_id IS NULL
            ORDER BY cb.purchased_at DESC
            LIMIT ? OFFSET ?`,
            [userId, Number(limit), Number(offset)]
        );

        if (bundles.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
            });
        }

        bundles.forEach((bundle) => {
            bundle.thumbnail = bundle.thumbnail
                ? bundleImageBaseUrl + bundle.thumbnail
                : null;
        });

        const bundleIds = bundles.map((b) => b.bundle_id);

        const placeholders = bundleIds.map(() => "?").join(",");

        const [courses] = await pool.query(
            `SELECT
                bc.bundle_id,
                c.id,
                c.title,
                c.thumbnail,
                c.price
         
            FROM bundle_courses bc
            INNER JOIN learning_courses c
                ON c.id = bc.course_id
            WHERE bc.bundle_id IN (${placeholders})
            ORDER BY bc.id ASC`,
            bundleIds
        );

        bundles.forEach((bundle) => {
            bundle.courses = courses
                .filter((course) => course.bundle_id === bundle.bundle_id)
                .map((course) => ({
                    ...course,
                    thumbnail: course.thumbnail
                        ? bundleImageBaseUrl + course.thumbnail
                        : null,
                }));
        });

        return res.status(200).json({
            success: true,
            data: bundles,
        });

    } catch (error) {
        console.error("[getAllMyBundlePurchases] Error =>", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch bundle purchases.",
        });
    }
};
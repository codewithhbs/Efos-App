const getPool = require("../config/db");
const { sendNotification, sendBulkNotification } = require("../utils/sendNotifications");
const pool = getPool();
const parseIds = (raw) => {
    if (!Array.isArray(raw)) return [];

    return [...new Set(
        raw
            .map((v) => parseInt(v, 10))
            .filter((v) => Number.isInteger(v) && v > 0)
    )].slice(0, 500); // hard cap
};


/**
 * Send notification to a single user
 * POST /api/notifications/send
 */
exports.sendSingleNotification = async (req, res) => {
    try {
        const {
            user_id,
            title,
            message,
            type = "general",
            screen = null,
            reference_id = null,
            channel = "default",
            data = {},
        } = req.body;

        if (!user_id || !title || !message) {
            return res.status(400).json({
                success: false,
                message: "user_id, title and message are required.",
            });
        }

        const [users] = await pool.query(
            `
            SELECT id, fcm_token
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [user_id]
        );

        if (!users.length) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const user = users[0];

        const result = await sendNotification({
            userId: user.id,
            fcm: user.fcm_token,
            title,
            message,
            type,
            screen,
            referenceId: reference_id,
            channel,
            data,
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Send notification to multiple users
 * POST /api/notifications/send-bulk
 */
exports.sendBulkNotificationController = async (req, res) => {
    try {
        const {
            user_ids,
            title,
            message,
            type = "general",
            screen = null,
            reference_id = null,
            channel = "default",
            data = {},
        } = req.body;

        if (
            !Array.isArray(user_ids) ||
            user_ids.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "user_ids array is required.",
            });
        }

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: "title and message are required.",
            });
        }

        const [users] = await pool.query(
            `
            SELECT id, fcm_token
            FROM users
            WHERE id IN (?)
            `,
            [user_ids]
        );

        if (!users.length) {
            return res.status(404).json({
                success: false,
                message: "No users found.",
            });
        }

        const result = await sendBulkNotification({
            users,
            title,
            message,
            type,
            screen,
            referenceId: reference_id,
            channel,
            data,
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Send notification to all users
 * POST /api/notifications/send-all
 */
exports.sendNotificationToAll = async (req, res) => {
    try {
        const {
            title,
            message,
            type = "general",
            screen = null,
            reference_id = null,
            channel = "default",
            data = {},
        } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: "title and message are required.",
            });
        }

        const [users] = await pool.query(`
            SELECT id, fcm_token
            FROM users
            WHERE role != 'admin'
        `);

        if (!users.length) {
            return res.status(404).json({
                success: false,
                message: "No users found.",
            });
        }

        const result = await sendBulkNotification({
            users,
            title,
            message,
            type,
            screen,
            referenceId: reference_id,
            channel,
            data,
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const page = parseInt(req.query.page || 1);
        const limit = parseInt(req.query.limit || 20);
        const offset = (page - 1) * limit;

        const [[{ total }]] = await pool.query(
            `
            SELECT COUNT(*) AS total
            FROM notifications
            WHERE user_id = ?
            AND is_deleted = 0
            `,
            [userId]
        );

        const [notifications] = await pool.query(
            `
            SELECT
                id,
                title,
                message,
                type,
                screen,
                reference_id,
                data,
                is_read,
                read_at,
                created_at
            FROM notifications
            WHERE user_id = ?
            AND is_deleted = 0
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            `,
            [userId, limit, offset]
        );

        return res.status(200).json({
            success: true,
            total,
            page,
            limit,
            unread: notifications.filter(n => !n.is_read).length,
            data: notifications,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


/**
 * Get Unread Count
 * GET /notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
    try {

        const [[result]] = await pool.query(
            `
            SELECT COUNT(*) AS unread
            FROM notifications
            WHERE user_id = ?
            AND is_deleted = 0
            AND is_read = 0
            `,
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            unread: result.unread,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


/**
 * Mark Single Notification Read
 * PUT /notifications/read/:id
 */
exports.markAsRead = async (req, res) => {
    try {

        const { id } = req.params;

        const [result] = await pool.query(
            `
            UPDATE notifications
            SET
                is_read = 1,
                read_at = NOW()
            WHERE id = ?
            AND user_id = ?
            `,
            [id, req.user.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Notification not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read.",
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


/**
 * Mark All Notifications Read
 * PUT /notifications/read-all
 */
exports.markAllAsRead = async (req, res) => {
    try {

        await pool.query(
            `
            UPDATE notifications
            SET
                is_read = 1,
                read_at = NOW()
            WHERE user_id = ?
            AND is_read = 0
            `,
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read.",
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


/**
 * Delete Notification
 * DELETE /notifications/:id
 */
exports.deleteNotification = async (req, res) => {
    try {

        const { id } = req.params;

        const [result] = await pool.query(
            `
            UPDATE notifications
            SET
                is_deleted = 1,
                deleted_at = NOW()
            WHERE id = ?
            AND user_id = ?
            `,
            [id, req.user.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Notification not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully.",
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


exports.bulkReadNotifications = async (req, res) => {
    try {
        const ids = parseIds(req.body?.ids);

        if (!ids.length) {
            return res.status(400).json({
                success: false,
                message: "No valid notification ids provided.",
            });
        }

        const [result] = await pool.query(
            `UPDATE notifications
             SET is_read = 1, read_at = NOW()
             WHERE id IN (?) AND user_id = ?`,
            [ids, req.user.id]
        );

        return res.json({
            success: true,
            message: `${result.affectedRows} notification(s) marked as read.`,
            updated: result.affectedRows,
        });

    } catch (error) {
        console.error("[bulkReadNotifications]", error);

        return res.status(500).json({
            success: false,
            message: "Could not mark notifications as read.",
        });
    }
};

// ─── Bulk Delete ──────────────────────────────────────────────
exports.bulkDeleteNotifications = async (req, res) => {
    try {
        const ids = parseIds(req.body?.ids);

        if (!ids.length) {
            return res.status(400).json({
                success: false,
                message: "No valid notification ids provided.",
            });
        }

        // user_id guard → user apni hi notifications delete kar sake
        const [result] = await pool.query(
            `DELETE FROM notifications
             WHERE id IN (?) AND user_id = ?`,
            [ids, req.user.id]
        );

        return res.json({
            success: true,
            message: `${result.affectedRows} notification(s) deleted.`,
            deleted: result.affectedRows,
        });

    } catch (error) {
        console.error("[bulkDeleteNotifications]", error);

        return res.status(500).json({
            success: false,
            message: "Could not delete notifications.",
        });
    }
};
const path = require("path");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

const getPool = require("../config/db");
const pool = getPool();

// Firebase Service Account
const serviceAccount = require(path.join(
    __dirname,
    "efos-12456-firebase-adminsdk-fbsvc-17ef791edb.json"
));

// Initialize once
if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
    });
}

const messaging = () => getMessaging();

/**
 * Save notification in database
 */
const saveNotification = async ({
    userId,
    title,
    message,
    type = "general",
    screen = null,
    referenceId = null,
    data = null,
    isSent = 0,
}) => {
    const [result] = await pool.query(
        `
        INSERT INTO notifications
        (
            user_id,
            title,
            message,
            type,
            screen,
            reference_id,
            data,
            is_sent,
            sent_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            userId,
            title,
            message,
            type,
            screen,
            referenceId,
            data ? JSON.stringify(data) : null,
            isSent,
            isSent ? new Date() : null,
        ]
    );

    return result.insertId;
};

const stringifyData = (data = {}) =>
    Object.keys(data || {}).reduce((obj, key) => {
        obj[key] = String(data[key]);
        return obj;
    }, {});

/**
 * Send Single Notification
 */
const sendNotification = async ({
    userId,
    fcm,
    title,
    message,
    type = "general",
    screen = null,
    referenceId = null,
    channel = "default",
    data = {},
}) => {
    try {
        if (!userId) {
            throw new Error("userId is required.");
        }

        const notificationId = await saveNotification({
            userId,
            title,
            message,
            type,
            screen,
            referenceId,
            data,
            isSent: 0,
        });

        if (!fcm) {
            return {
                success: true,
                notificationId,
                message: "Notification saved. No FCM token.",
            };
        }

        const payload = {
            token: fcm,
            notification: { title, body: message },
            android: {
                priority: "high",
                notification: { channelId: channel, sound: "default" },
            },
            apns: {
                payload: { aps: { sound: "default" } },
            },
            data: stringifyData(data),
        };

        const response = await messaging().send(payload);

        await pool.query(
            `UPDATE notifications
             SET is_sent = 1, sent_at = NOW()
             WHERE id = ?`,
            [notificationId]
        );

        return { success: true, notificationId, response };

    } catch (error) {
        console.error("Notification Error:", error);

        return { success: false, error: error.message };
    }
};

/**
 * Send Bulk Notifications
 * users = [{ id: 1, fcm: "xxxx" }]
 */
const sendBulkNotification = async ({
    users,
    title,
    message,
    type = "general",
    screen = null,
    referenceId = null,
    channel = "default",
    data = {},
}) => {
    try {
        if (!users || users.length === 0) {
            return { success: false, message: "No users found." };
        }

        const tokens = [];

        for (const user of users) {
            const notificationId = await saveNotification({
                userId: user.id,
                title,
                message,
                type,
                screen,
                referenceId,
                data,
                isSent: 0,
            });

            user.notificationId = notificationId;

            if (user.fcm) tokens.push(user.fcm);
        }

        if (!tokens.length) {
            return { success: true, message: "Notifications saved successfully." };
        }

        const payload = {
            notification: { title, body: message },
            android: {
                priority: "high",
                notification: { channelId: channel, sound: "default" },
            },
            apns: {
                payload: { aps: { sound: "default" } },
            },
            data: stringifyData(data),
            tokens,
        };

        const response = await messaging().sendEachForMulticast(payload);

        const ids = users.map((u) => u.notificationId).filter(Boolean);

        if (ids.length) {
            await pool.query(
                `UPDATE notifications
                 SET is_sent = 1, sent_at = NOW()
                 WHERE id IN (?)`,
                [ids]
            );
        }

        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
        };

    } catch (error) {
        console.error("Bulk Notification Error:", error);

        return { success: false, error: error.message };
    }
};

module.exports = {
    sendNotification,
    sendBulkNotification,
};
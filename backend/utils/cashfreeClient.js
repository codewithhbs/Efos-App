const axios = require("axios");

// ══════════════════════════════════════════
// Shared Cashfree API client.
// Centralizes base URL / auth headers so every payment flow (course,
// bundle, session) talks to Cashfree the same way.
// ══════════════════════════════════════════

function getConfig() {
    const APP_ID = process.env.CASHFREE_API_KEY;
    const SECRET_KEY = process.env.CASHFREE_API_SECRET;
    const MODE = process.env.CASHFREE_MODE;

    const BASE_URL =
        MODE === "production"
            ? "https://api.cashfree.com/pg"
            : "https://sandbox.cashfree.com/pg";

    return { APP_ID, SECRET_KEY, MODE, BASE_URL };
}

function isConfigured() {
    const { APP_ID, SECRET_KEY, BASE_URL } = getConfig();
    return Boolean(APP_ID && SECRET_KEY && BASE_URL);
}


async function createOrder({
    order_id,
    order_amount,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    order_note,
    return_url,
}) {
    const { APP_ID, SECRET_KEY, BASE_URL, MODE } = getConfig();

    const payload = {
        order_id,
        order_amount,
        order_currency: "INR",
        customer_details: {
            customer_id: String(customer_id),
            customer_name,
            customer_email,
            customer_phone,
        },
        order_meta: {
            return_url:
                return_url ||
                `https://yourdomain.com/payment-success?order_id={order_id}`,
        },
        order_note: order_note || "",
    };

    const response = await axios.post(`${BASE_URL}/orders`, payload, {
        headers: {
            accept: "application/json",
            "content-type": "application/json",
            "x-client-id": APP_ID,
            "x-client-secret": SECRET_KEY,
            "x-api-version": "2023-08-01",
        },
    });

    return {
        order_id: response.data.order_id,
        payment_session_id: response.data.payment_session_id,
        cf_order_id: response.data.cf_order_id,
        order_mode: MODE,

    };
}

/**
 * Fetches all payment attempts for an order and returns the most recent one.
 * Returns null if no payment attempt exists yet.
 *

 */
async function getLatestPayment(order_id) {
    const { APP_ID, SECRET_KEY, BASE_URL } = getConfig();

    const response = await axios.get(
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

    const payments = response.data;

    if (!payments || payments.length === 0) {
        return null;
    }

    return payments[payments.length - 1];
}

/**
 * Maps a friendly, user-safe error message from a raw Cashfree error.
 */
function friendlyErrorMessage(cfError) {
    const cfMsg =
        cfError?.response?.data?.message?.toLowerCase() || "";

    if (cfMsg.includes("invalid")) {
        return "Payment details are invalid. Please check and retry.";
    }

    if (cfMsg.includes("unauthorized") || cfMsg.includes("authentication")) {
        return "Payment gateway authentication failed. Please contact support.";
    }

    if (cfMsg.includes("duplicate")) {
        return "Duplicate payment request detected. Please wait a moment and retry.";
    }

    return "Payment gateway error. Please try again.";
}

module.exports = {
    getConfig,
    isConfigured,
    createOrder,
    getLatestPayment,
    friendlyErrorMessage,
};
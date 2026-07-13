const nodemailer = require("nodemailer");

const MAIL_PORT = Number(process.env.MAIL_PORT) || 587;
const SECURE = MAIL_PORT === 465;

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: MAIL_PORT,
  secure: SECURE,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 50,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
});

let mailReady = false;

transporter.verify((err) => {
  if (err) {
    mailReady = false;
    console.error("❌ Mail server error:", err.message);
  } else {
    mailReady = true;
    console.log("✅ Mail server ready");
  }
});

// ─── HARDENED RECIPIENT VALIDATION ────────────────────────────
// Rules:
//  - must be a plain string (array / object / number → reject)
//  - exactly ONE address (no comma, no semicolon, no angle-bracket list)
//  - no CR/LF/NUL → blocks SMTP header injection (Bcc:, To:, etc.)
//  - no whitespace anywhere
//  - strict single-address regex, length capped
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,63}$/;

const HEADER_INJECT_RE = /[\r\n\u0000\u2028\u2029]/;

const sanitizeRecipient = (to) => {
  if (typeof to !== "string") {
    return { ok: false, error: "Recipient must be a single email string" };
  }

  const value = to.trim();

  if (!value) {
    return { ok: false, error: "Recipient is required" };
  }

  if (value.length > 254) {
    return { ok: false, error: "Recipient too long" };
  }

  if (HEADER_INJECT_RE.test(value)) {
    return { ok: false, error: "Invalid recipient" };
  }

  // multi-recipient attempts
  if (/[,;<>()\[\]\\"']/.test(value) || /\s/.test(value)) {
    return { ok: false, error: "Only one recipient allowed" };
  }

  if ((value.match(/@/g) || []).length !== 1) {
    return { ok: false, error: "Invalid email address" };
  }

  const [local, domain] = value.split("@");

  if (!local || local.length > 64 || !domain || domain.length > 255) {
    return { ok: false, error: "Invalid email address" };
  }

  if (domain.startsWith("-") || domain.endsWith("-") || domain.includes("..")) {
    return { ok: false, error: "Invalid email address" };
  }

  if (!EMAIL_RE.test(value)) {
    return { ok: false, error: "Invalid email address" };
  }

  return { ok: true, value: value.toLowerCase() };
};

// subject bhi header hai → CRLF strip
const sanitizeHeaderText = (str = "") =>
  String(str).replace(HEADER_INJECT_RE, " ").trim().slice(0, 200);

const stripHtml = (html = "") =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Single-recipient only. cc/bcc/replyTo intentionally NOT supported.
 * @returns {Promise<{success:boolean, messageId?:string, error?:string}>}
 */
const sendEmail = async ({
  to,
  subject,
  text = "",
  html = "",
  attachments = [],
  retries = 2,
}) => {
  const recipient = sanitizeRecipient(to);

  if (!recipient.ok) {
    console.error("❌ Email blocked:", recipient.error, "| raw:", JSON.stringify(to));
    return { success: false, error: recipient.error };
  }

  const safeSubject = sanitizeHeaderText(subject);

  if (!safeSubject) {
    return { success: false, error: "Subject is required" };
  }

  const safeAttachments = Array.isArray(attachments) ? attachments : [];

  const mailOptions = {
    from: `"${sanitizeHeaderText(process.env.APP_NAME || "EFOS")}" <${
      process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME
    }>`,
    to: recipient.value,
    subject: safeSubject,
    text: text || stripHtml(html),
    html,
    attachments: safeAttachments,
  };

  let lastError = "Unknown mail error";

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);

      if (!info.accepted || info.accepted.length !== 1) {
        lastError = "Recipient rejected by mail server";
        break;
      }

      console.log(`📧 Email sent → ${recipient.value} | ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
      };
    } catch (error) {
      lastError = error.message;

      console.error(
        `❌ Email attempt ${attempt}/${retries + 1} failed → ${recipient.value}: ${error.message}`
      );

      const permanent =
        error.responseCode === 535 ||
        error.responseCode === 550 ||
        error.code === "EAUTH" ||
        error.code === "EENVELOPE";

      if (permanent || attempt === retries + 1) break;

      await sleep(attempt * 1000);
    }
  }

  return { success: false, error: lastError };
};

const isMailReady = () => mailReady;

module.exports = { sendEmail, isMailReady, sanitizeRecipient, transporter };
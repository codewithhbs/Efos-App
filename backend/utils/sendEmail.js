const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_ENCRYPTION === "ssl",
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});


transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Mail server error:", err.message);
  } else {
    console.log("✅ Mail server ready");
  }
});

const sendEmail = async ({
  to,
  subject,
  text = "",
  html = "",
  attachments = [],
}) => {
  try {
    const mailOptions = {
      from: `"${process.env.APP_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      text,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("📧 Email sent:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Email Error:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = { sendEmail };
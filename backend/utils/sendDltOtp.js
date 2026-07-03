const axios = require("axios");

const API_KEY = "PkHQynCRMolGLdg5O16dkd5L9JUOzMM3lGBJYy1yA+M=";
const CLIENT_ID = "789de199-f135-4701-889b-476a258f75f6";
const SENDER_ID = "EFOSed";

const sendDltOtp = async (mobileNumber, otp) => {
  try {
    // DLT approved template
    const message = `Your OTP for EFOS EDUMARKETERS PRIVATE LIMITED login is ${otp}.This OTP is valid for 10 minutes only. Do not share this OTP with anyone.`;

    // Build EXACT URL like browser
    const url =
      `http://sms.shinenetcore.in/api/v2/SendSMS` +
      `?SenderId=${encodeURIComponent(SENDER_ID)}` +
      `&Is_Unicode=false` +
      `&Is_Flash=false` +
      `&Message=${encodeURIComponent(message)}` +
      `&MobileNumbers=${encodeURIComponent(mobileNumber)}` +
      `&ApiKey=${encodeURIComponent(API_KEY)}` +
      `&ClientId=${encodeURIComponent(CLIENT_ID)}`;

    console.log("========== SMS URL ==========");
    console.log(url);
    console.log("=============================");

    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        Accept: "application/json",
      },
    });

    console.log("========== SMS RESPONSE ==========");
    console.log(response.data);
    console.log("==================================");

    return {
      success: true,
      data: response.data,
    };
  } catch (err) {
    console.error("========== SMS ERROR ==========");
    console.error(err.response?.data || err.message);
    console.error("==============================");

    return {
      success: false,
      error: err.response?.data || err.message,
    };
  }
};

module.exports = sendDltOtp;
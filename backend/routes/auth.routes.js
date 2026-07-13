const express = require("express");
const router = express.Router();

const auth = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/authMiddleware");
const { loginLimiter } = require("../middleware/rateLimiter");
const { createOrder, verifyPayment, getAvailableCoupon, applyCoupon, getAllMyEnrolledCourses, getMyAllMentorSessions, getMyAllApplications, getAllMyPayments } = require("../controllers/order.controller");
const upload = require("../middleware/multer");

// ─── Register ────────────────────────────────────────────────
router.post("/register", auth.registerUser);
router.post("/verify-register-otp", auth.verifyRegisterOtp);
router.post("/resend-register-otp", auth.resendRegisterOtp);
 
// ─── Login (dual: password | otp) ────────────────────────────
// body: { registration_number, mode: "password" | "otp", password? }
router.post("/login", auth.loginUser);
router.post("/verify-otp", auth.verifyOtp);
router.post("/resend-login-otp", auth.resendLoginOtp);
 
// ─── Forget Password ─────────────────────────────────────────
router.post("/forget-password", auth.forgetPassword);
router.post("/verify-forget-password", auth.verifyForgetPasswordOtp);
router.post("/resend-forget-password-otp", auth.resendForgetPasswordOtp);
 
// ─── Session ─────────────────────────────────────────────────
router.post("/refresh-token", auth.refreshToken);
router.post("/logout", auth.logoutUser);
router.post("/logout-all", authMiddleware, auth.logoutAllDevices);
 
// ─── Profile ─────────────────────────────────────────────────
router.get("/me", authMiddleware, auth.getProfile);
router.put("/update", authMiddleware, auth.updateProfile);
router.post("/update-student-profile", authMiddleware,upload.single('photo'), auth.updateStudentProfile);

router.post("/change-password", authMiddleware, auth.changePassword);
router.post("/fcm-token", authMiddleware, auth.updateFcmToken);
router.delete("/delete-account", authMiddleware, auth.deleteUser);

// ========================
// ORDER ROUTES
// ========================
router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);
router.get("/available-coupons", getAvailableCoupon);
router.post("/apply-coupon", applyCoupon);

// ========================
// ENROLLED COURSES ROUTES
// ========================
router.get("/enrolled-courses", getAllMyEnrolledCourses)
router.get("/my-mentor-sessions", getMyAllMentorSessions)
router.get("/my-applications", getMyAllApplications)
router.get("/my-payments", getAllMyPayments)




// 




module.exports = router;
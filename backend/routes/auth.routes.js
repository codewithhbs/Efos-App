const express = require("express");
const router = express.Router();


const {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    logoutAllDevices,
    getProfile,
    deleteUser,
    updateProfile,
    updateFcmToken,
    forgetPassword,
    verifyForgetPasswordOtp,
    resendForgetPasswordOtp,
    updateStudentProfile,
} = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/authMiddleware");
const { loginLimiter } = require("../middleware/rateLimiter");
const { createOrder, verifyPayment, getAvailableCoupon, applyCoupon, getAllMyEnrolledCourses, getMyAllMentorSessions, getMyAllApplications, getAllMyPayments } = require("../controllers/order.controller");
const upload = require("../middleware/multer");

// ========================
// PUBLIC ROUTES
// ========================
router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/refresh-token", refreshToken);
router.post("/forget-password", forgetPassword);
router.post("/verify-forget-password", verifyForgetPasswordOtp);
router.post("/resend-forget-password-otp", resendForgetPasswordOtp);


// ========================
// PROTECTED ROUTES
// ========================
router.use(authMiddleware);

router.get("/me", getProfile);
router.post("/logout", logoutUser);
router.put("/update", updateProfile);
router.put("/update-fcm", updateFcmToken);
router.post("/logout-all", logoutAllDevices);
router.delete("/delete-account", deleteUser);
router.post("/update-student-profile", upload.single("photo"), updateStudentProfile);

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
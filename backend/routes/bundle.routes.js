const express = require("express");
const { getAllBundleCourses, getSingleBundle } = require("../controllers/bundle.course.controllers");
const { initBundlePayment, verifyBundlePayment, checkBundlePurchaseStatus, getAllMyBundlePurchases } = require("../controllers/bundlePaymentController");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");


router.get("/get-all-bundle-courses", getAllBundleCourses);
router.get("/get-single-bundle/:id", getSingleBundle);
router.post("/:bundleId/init-payment", authMiddleware, initBundlePayment);
router.post("/verify-payment", authMiddleware, verifyBundlePayment);
router.get("/:bundleId/purchase-status", authMiddleware, checkBundlePurchaseStatus);

router.get("/my-bundle-purchases", authMiddleware, getAllMyBundlePurchases);

module.exports = router;
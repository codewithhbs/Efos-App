const express = require("express");
const { getOnBoardingSlides, getLearningCourses, getAppEvents, getLearningCoursesViaId, createOnboardingSlide, updateOnboardingSlide, deleteOnboardingSlide, getBlogs, singleBlog } = require("../controllers/extra.controller");
const { getAllLessonsChapters, getVideosByLessonId, getAllMentors, getOneMentor, getMentorAvailableSlots, verifyBookingPayment, bookSession, getAllMentorsCategories, getMyBookingsDetails, getAllQuizes } = require("../controllers/course");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");

router.get("/onboard-slides", getOnBoardingSlides)
router.post("/onboard-slides", upload.single("onboard"), createOnboardingSlide)
router.put("/onboard-slides/:id", upload.single("onboard"), updateOnboardingSlide);
router.delete("/onboard-slides/:id", deleteOnboardingSlide);


router.get("/home-learning-course", authMiddleware, getLearningCourses)
router.get("/home-learning-course-details/:id", getLearningCoursesViaId)
router.get("/get-app-events", getAppEvents)



// =====================================
//       Video routes
// =====================================
router.get("/lessons-chapters/:courseId", authMiddleware, getAllLessonsChapters)
router.get("/videos/:lessonId/:courseId", authMiddleware, getVideosByLessonId)
router.get("/all-quiz/:id", authMiddleware, getAllQuizes)



// =====================================
//       Mentor routes
// =====================================

router.get("/mentors-categories", getAllMentorsCategories)
router.get("/mentors", getAllMentors)
router.get("/mentors/:id", getOneMentor)
router.get("/mentors/:mentorId/slots", getMentorAvailableSlots)
router.post("/mentors/book-session", authMiddleware, bookSession)
router.get("/mentors-booking/verify", verifyBookingPayment)
router.get("/mentors-booking/details/:orderId", authMiddleware, getMyBookingsDetails)





router.post("/send", notificationController.sendSingleNotification);
router.post("/send-bulk", notificationController.sendBulkNotificationController);
router.post("/send-all", notificationController.sendNotificationToAll);



router.get("/notification", authMiddleware, notificationController.getNotifications);
router.get("/notification/unread-count", authMiddleware, notificationController.getUnreadCount);
router.put("/notification/read/:id", authMiddleware, notificationController.markAsRead);
router.put("/notification/read-all", authMiddleware, notificationController.markAllAsRead);
router.delete("/notification/:id", authMiddleware, notificationController.deleteNotification);
router.put("/notification/bulk-read", authMiddleware, notificationController.bulkReadNotifications);
router.post("/notification/bulk-delete", authMiddleware, notificationController.bulkDeleteNotifications);


router.get("/blogs", getBlogs);
router.get("/blogs/:id", singleBlog);




module.exports = router;
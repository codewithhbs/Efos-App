const express = require("express");
const { getOnBoardingSlides, getLearningCourses, getAppEvents, getLearningCoursesViaId } = require("../controllers/extra.controller");
const { getAllLessonsChapters, getVideosByLessonId, getAllMentors, getOneMentor, getMentorAvailableSlots, verifyBookingPayment, bookSession, getAllMentorsCategories, getMyBookingsDetails, getAllQuizes } = require("../controllers/course");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.get("/onboard-slides", getOnBoardingSlides)
router.get("/home-learning-course", authMiddleware, getLearningCourses)
router.get("/home-learning-course-details/:id", getLearningCoursesViaId)
router.get("/get-app-events", getAppEvents)



// =====================================
//       Video routes
// =====================================
router.get("/lessons-chapters/:courseId", authMiddleware, getAllLessonsChapters)
router.get("/videos/:lessonId/:courseId",authMiddleware, getVideosByLessonId)
router.get("/all-quiz/:id",authMiddleware, getAllQuizes)



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



module.exports = router;
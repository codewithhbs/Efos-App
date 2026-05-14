const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getQuizQuestionAndOptions, submitAnswers } = require("../controllers/quiz");
const router = express.Router();

router.get("/quiz-details/:quizId", getQuizQuestionAndOptions)
router.post("/submit-quiz/:quizId",authMiddleware, submitAnswers)



module.exports = router;
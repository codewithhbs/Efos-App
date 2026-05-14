const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const extraRoutes = require("./extra.route");
const JobRoutes = require("./job.routes");
const QuizRoutes = require("./quiz.routes");




router.use("/auth", authRoutes);
router.use("/extra", extraRoutes);
router.use("/job", JobRoutes);

router.use("/quiz", QuizRoutes);


module.exports = router;
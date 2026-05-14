const express = require("express");
const { getJobCategories, findJobs, findOneJob, applyJob } = require("../controllers/job.controller");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/category", getJobCategories)
router.get("/get", authMiddleware,findJobs)
router.get("/search/:slug",authMiddleware, findOneJob)
router.post("/apply/:jobId", authMiddleware, applyJob)


module.exports = router;
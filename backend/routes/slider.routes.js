const express = require("express");
const router = express.Router();

const {
  createSlider,
  getAllSliders,
  getActiveSliders,
  getSliderById,
  updateSlider,
  updateSliderStatus,
  deleteSlider,
} = require("../controllers/Slider.controller");
const sliderUpload = require("../middleware/sliderUpload");


// Admin
router.post("/", sliderUpload.single("image"), createSlider);
router.get("/", getAllSliders);
router.get("/:id", getSliderById);
router.put("/:id", sliderUpload.single("image"), updateSlider);
router.patch("/:id/status", updateSliderStatus);
router.delete("/:id", deleteSlider);

// Mobile app
router.get("/active/list", getActiveSliders);

module.exports = router;
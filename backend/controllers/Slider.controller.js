const getPool = require("../config/db");
const fs = require("fs");
const path = require("path");


const getFullImageUrl = (req, imageUrl) => {
  if (!imageUrl) return null;

  // Already full URL hai to same return karo
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  // Current request ka host automatically lega
 const baseUrl = process.env.API_BASE_URL;

  return `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
};


// =====================================================
// CREATE SLIDER
// =====================================================
const createSlider = async (req, res) => {
  try {
    const pool = await getPool();

    const {
      title,
      subtitle,
      button_text,
      button_action,
      sort_order = 0,
      is_active = 1,
      start_date = null,
      end_date = null,
    } = req.body;

    // Image can come from multer
    const image_url = req.file
      ? `/uploads/sliders/${req.file.filename}`
      : req.body.image_url || null;

    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: "Slider image is required",
      });
    }

    const [result] = await pool.execute(
      `
      INSERT INTO home_sliders
      (
        title,
        subtitle,
        image_url,
        button_text,
        button_action,
        sort_order,
        is_active,
        start_date,
        end_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title || null,
        subtitle || null,
        image_url,
        button_text || null,
        button_action || null,
        Number(sort_order) || 0,
        Number(is_active) ? 1 : 0,
        start_date || null,
        end_date || null,
      ]
    );

    const [rows] = await pool.execute(
      `SELECT * FROM home_sliders WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: "Slider created successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("Create slider error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create slider",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL SLIDERS
// =====================================================
const getAllSliders = async (req, res) => {
  try {
    const pool = await getPool();

    const [rows] = await pool.execute(`
      SELECT *
      FROM home_sliders
      ORDER BY sort_order ASC, id DESC
    `);

    const sliders = rows.map((slider) => ({
      ...slider,
      image_url: getFullImageUrl(req, slider.image_url),
    }));

    return res.status(200).json({
      success: true,
      message: "Sliders fetched successfully",
      count: sliders.length,
      data: sliders,
    });

  } catch (error) {
    console.error("Get all sliders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch sliders",
      error: error.message,
    });
  }
};


// =====================================================
// GET ACTIVE SLIDERS
// =====================================================
const getActiveSliders = async (req, res) => {
  try {
    const pool = await getPool();

    const [rows] = await pool.execute(`
      SELECT *
      FROM home_sliders
      WHERE is_active = 1
        AND (
          start_date IS NULL
          OR start_date <= NOW()
        )
        AND (
          end_date IS NULL
          OR end_date >= NOW()
        )
      ORDER BY sort_order ASC, id DESC
    `);

    const sliders = rows.map((slider) => ({
      ...slider,
      image_url: getFullImageUrl(req, slider.image_url),
    }));

    return res.status(200).json({
      success: true,
      count: sliders.length,
      data: sliders,
    });

  } catch (error) {
    console.error("Get active sliders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch active sliders",
      error: error.message,
    });
  }
};


// =====================================================
// GET SINGLE SLIDER
// =====================================================
const getSliderById = async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    const [rows] = await pool.execute(
      `
      SELECT *
      FROM home_sliders
      WHERE id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Slider not found",
      });
    }

    const slider = {
      ...rows[0],
      image_url: getFullImageUrl(req, rows[0].image_url),
    };

    return res.status(200).json({
      success: true,
      data: slider,
    });

  } catch (error) {
    console.error("Get slider by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch slider",
      error: error.message,
    });
  }
};


// =====================================================
// UPDATE SLIDER
// =====================================================
const updateSlider = async (req, res) => {
  try {
    const pool = await getPool();

    const { id } = req.params;

    const {
      title,
      subtitle,
      button_text,
      button_action,
      sort_order,
      is_active,
      start_date,
      end_date,
    } = req.body;

    // Get existing slider
    const [existingRows] = await pool.execute(
      `SELECT * FROM home_sliders WHERE id = ?`,
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Slider not found",
      });
    }

    const existingSlider = existingRows[0];

    let image_url = existingSlider.image_url;

    // If new image uploaded
    if (req.file) {
      image_url = `/uploads/sliders/${req.file.filename}`;

      // Delete old local image
      if (
        existingSlider.image_url &&
        existingSlider.image_url.startsWith("/uploads/")
      ) {
        const oldImagePath = path.join(
          process.cwd(),
          existingSlider.image_url
        );

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }

    await pool.execute(
      `
      UPDATE home_sliders
      SET
        title = ?,
        subtitle = ?,
        image_url = ?,
        button_text = ?,
        button_action = ?,
        sort_order = ?,
        is_active = ?,
        start_date = ?,
        end_date = ?
      WHERE id = ?
      `,
      [
        title !== undefined ? title : existingSlider.title,
        subtitle !== undefined ? subtitle : existingSlider.subtitle,
        image_url,
        button_text !== undefined
          ? button_text
          : existingSlider.button_text,
        button_action !== undefined
          ? button_action
          : existingSlider.button_action,
        sort_order !== undefined
          ? Number(sort_order)
          : existingSlider.sort_order,
        is_active !== undefined
          ? Number(is_active)
            ? 1
            : 0
          : existingSlider.is_active,
        start_date !== undefined
          ? start_date || null
          : existingSlider.start_date,
        end_date !== undefined
          ? end_date || null
          : existingSlider.end_date,
        id,
      ]
    );

    const [rows] = await pool.execute(
      `SELECT * FROM home_sliders WHERE id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "Slider updated successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("Update slider error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update slider",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE SLIDER STATUS
// =====================================================
const updateSliderStatus = async (req, res) => {
  try {
    const pool = await getPool();

    const { id } = req.params;
    const { is_active } = req.body;

    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: "is_active is required",
      });
    }

    const [result] = await pool.execute(
      `
      UPDATE home_sliders
      SET is_active = ?
      WHERE id = ?
      `,
      [Number(is_active) ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Slider not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Slider status updated successfully",
    });
  } catch (error) {
    console.error("Update slider status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update slider status",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE SLIDER
// =====================================================
const deleteSlider = async (req, res) => {
  try {
    const pool = await getPool();

    const { id } = req.params;

    // Get slider first
    const [rows] = await pool.execute(
      `SELECT * FROM home_sliders WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Slider not found",
      });
    }

    const slider = rows[0];

    // Delete database record
    await pool.execute(
      `DELETE FROM home_sliders WHERE id = ?`,
      [id]
    );

    // Delete local image
    if (
      slider.image_url &&
      slider.image_url.startsWith("/uploads/")
    ) {
      const imagePath = path.join(
        process.cwd(),
        slider.image_url
      );

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Slider deleted successfully",
    });
  } catch (error) {
    console.error("Delete slider error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete slider",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================
module.exports = {
  createSlider,
  getAllSliders,
  getActiveSliders,
  getSliderById,
  updateSlider,
  updateSliderStatus,
  deleteSlider,
};
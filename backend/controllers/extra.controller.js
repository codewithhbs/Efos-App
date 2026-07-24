const getPool = require("../config/db");
const pool = getPool();
const fs = require("fs");
const path = require("path");


exports.createOnboardingSlide = async (req, res) => {
  try {
    let {
      title,
      description,
      position = 1,
      is_active = 1,
    } = req.body;

    let image_url = req.file ? req.file.path : null;


    if (req.file) {
      image_url = req.file.path.replace(/\\/g, "/");
    }

    if (!title || !image_url) {
      return res.status(400).json({
        success: false,
        message: "Title and image_url are required.",
      });
    }

    is_active = is_active ? 1 : 0;

    const [result] = await pool.query(
      `INSERT INTO onboarding_slides
      (title, description, image_url, position, is_active)
      VALUES (?, ?, ?, ?, ?)`,
      [title, description || null, image_url, position, is_active]
    );

    return res.status(201).json({
      success: true,
      message: "Onboarding slide created successfully",
      data: {
        id: result.insertId,
        title,
        description,
        image_url,
        position,
        is_active,
      },
    });

  } catch (error) {
    console.error("[createOnboardingSlide]", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getOnBoardingSlides = async (req, res) => {
  try {

    const [slides] = await pool.query(
      `SELECT id, title, description, image_url, position
       FROM onboarding_slides
       WHERE is_active = 1
       ORDER BY position ASC`
    );

    const imageUrl = process.env.APP_API_URL_BACKEND || "";

    slides.forEach(slide => {
      slide.image_url = imageUrl + slide.image_url;
    });


    return res.json({
      success: true,
      count: slides.length,
      data: slides,
    });

  } catch (error) {
    console.error("[getOnBoardingSlides]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch onboarding slides",
    });
  }
};


exports.updateOnboardingSlide = async (req, res) => {
  try {
    const { id } = req.params;

    let {
      title,
      description,
      position,
      is_active,
    } = req.body;

    const [rows] = await pool.query(
      "SELECT * FROM onboarding_slides WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Onboarding slide not found.",
      });
    }

    const slide = rows[0];

    let image_url = slide.image_url;

    // New image uploaded
    if (req.file) {
      image_url = req.file.path.replace(/\\/g, "/");

      // Delete old image
      if (slide.image_url) {
        const oldImagePath = path.join(process.cwd(), slide.image_url);

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    await pool.query(
      `UPDATE onboarding_slides
      SET
        title = ?,
        description = ?,
        image_url = ?,
        position = ?,
        is_active = ?
      WHERE id = ?`,
      [
        title ?? slide.title,
        description ?? slide.description,
        image_url,
        position ?? slide.position,
        is_active !== undefined
          ? (is_active ? 1 : 0)
          : slide.is_active,
        id,
      ]
    );

    return res.json({
      success: true,
      message: "Onboarding slide updated successfully.",
    });

  } catch (error) {
    console.error("[updateOnboardingSlide]", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteOnboardingSlide = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      "SELECT * FROM onboarding_slides WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Onboarding slide not found.",
      });
    }

    const slide = rows[0];

    // Delete image
    if (slide.image_url) {
      const imagePath = path.join(process.cwd(), slide.image_url);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await pool.query(
      "DELETE FROM onboarding_slides WHERE id = ?",
      [id]
    );

    return res.json({
      success: true,
      message: "Onboarding slide deleted successfully.",
    });

  } catch (error) {
    console.error("[deleteOnboardingSlide]", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Learning coourses for home only 5
exports.getLearningCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      featured,
      free,
      level,
      language,
      search,
      sort = "created_at",
      order = "DESC",
    } = req.query;

    const userId = req.user?.id || null;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // ===============================
    // WHERE CLAUSE
    // ===============================
    let whereClause = `WHERE status = 1`;
    const queryParams = [];

    if (featured !== undefined) {
      whereClause += ` AND featured = ?`;
      queryParams.push(
        featured === "true" || featured === "1" ? 1 : 0
      );
    }

    if (free !== undefined) {
      whereClause += ` AND is_free = ?`;
      queryParams.push(
        free === "true" || free === "1" ? 1 : 0
      );
    }

    if (level) {
      whereClause += ` AND level = ?`;
      queryParams.push(level);
    }

    if (language) {
      whereClause += ` AND language = ?`;
      queryParams.push(language);
    }

    if (search) {
      whereClause += ` AND (title LIKE ? OR short_description LIKE ?)`;
      const searchText = `%${search}%`;
      queryParams.push(searchText, searchText);
    }

    // ===============================
    // SAFE SORT
    // ===============================
    const allowedSort = [
      "created_at",
      "title",
      "price",
      "discount_price",
    ];

    const sortField = allowedSort.includes(sort)
      ? sort
      : "created_at";

    const sortOrder =
      order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // ===============================
    // CUSTOM ORDER
    // Featured First
    // Paid Second
    // Free Third
    // ===============================
    const customOrder = `
            featured DESC,
            is_free ASC,
            ${sortField} ${sortOrder}
        `;

    // ===============================
    // GET COURSES
    // ===============================
    const [courses] = await pool.query(
      `
            SELECT
                id,
                title,
                language,
                level,
                duration,
                short_description,
                price,
                is_free,
                has_discount,
                thumbnail,
                discount_from,
                discount_price,
                discount_to,
                featured,
                created_at
            FROM learning_courses
            ${whereClause}
            ORDER BY ${customOrder}
            LIMIT ? OFFSET ?
            `,
      [...queryParams, limitNum, offset]
    );

    // ===============================
    // TOTAL COUNT
    // ===============================
    const [[{ total }]] = await pool.query(
      `
            SELECT COUNT(*) AS total
            FROM learning_courses
            ${whereClause}
            `,
      queryParams
    );

    // ===============================
    // PURCHASED IDS
    // ===============================
    let purchasedIds = [];

    if (userId) {
      const [purchased] = await pool.query(
        `
                SELECT learning_course_id
                FROM course_buys
                WHERE user_id = ?
                `,
        [userId]
      );

      purchasedIds = purchased.map(
        (item) => item.learning_course_id
      );
    }

    // ===============================
    // FORMAT DATA
    // ===============================
    const baseUrl = process.env.APP_API_URL || "";

    const data = courses.map((course) => {
      const isAlreadyPurchase =
        purchasedIds.includes(course.id);

      return {
        ...course,

        thumbnail: course.thumbnail
          ? course.thumbnail.startsWith("http")
            ? course.thumbnail
            : `${baseUrl}${course.thumbnail}`
          : null,

        final_price:
          course.has_discount &&
            course.discount_price
            ? parseFloat(course.discount_price)
            : parseFloat(course.price),

        isAlreadyPurchase,
      };
    });

    // ===============================
    // RESPONSE
    // ===============================
    return res.json({
      success: true,
      count: data.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data,
    });

  } catch (error) {
    console.error("[getLearningCourses Error]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch learning courses",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

exports.getLearningCoursesViaId = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    // =====================================
    // VALIDATION
    // =====================================
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    // =====================================
    // COURSE DETAILS
    // =====================================
    const [rows] = await pool.query(
      `SELECT * FROM learning_courses
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let course = rows[0];

    // =====================================
    // PURCHASE STATUS
    // =====================================
    let purchaseStatus = false;

    if (userId) {
      const [purchaseRows] = await pool.query(
        `SELECT id
         FROM course_buys
         WHERE user_id = ?
         AND learning_course_id = ?
         AND payment_status = 'success'
         AND is_active = 1
         LIMIT 1`,
        [userId, id]
      );

      purchaseStatus = purchaseRows.length > 0;
    }

    // =====================================
    // BASE URL
    // =====================================
    const baseUrl = process.env.APP_API_URL || "";

    course.thumbnail = course.thumbnail
      ? course.thumbnail.startsWith("http")
        ? course.thumbnail
        : `${baseUrl}${course.thumbnail}`
      : null;

    // =====================================
    // FINAL PRICE
    // =====================================
    course.final_price =
      Number(course.has_discount) === 1 &&
        course.discount_price
        ? parseFloat(course.discount_price)
        : parseFloat(course.price);

    // =====================================
    // COURSE CHAPTERS
    // =====================================
    const [chapters] = await pool.query(
      `SELECT
          id,
          course_id,
          title,
          status
       FROM course_chapters
       WHERE course_id = ?
       AND status = 1
       ORDER BY sort_order ASC, id ASC`,
      [id]
    );

    // =====================================
    // COURSE LESSONS / VIDEOS
    // =====================================
    const [lessons] = await pool.query(
      `SELECT
          id,
          course_id,
          chapter_id,
          title,
          slug,
          type,
          video_source,
          video_url,
          duration_seconds,
          sort_order,
          is_free_preview,
          status
       FROM course_lessons
       WHERE course_id = ?
       AND status = 1
       ORDER BY chapter_id ASC, sort_order ASC, id ASC`,
      [id]
    );

    // =====================================
    // FORMAT LESSONS LOCK / UNLOCK
    // =====================================
    const formattedLessons = lessons.map(
      (item) => {
        const unlocked =
          purchaseStatus ||
          Number(item.is_free_preview) === 1;

        return {
          ...item,
          locked: !unlocked,
          unlocked,
        };
      }
    );

    // =====================================
    // MERGE CHAPTERS WITH LESSONS
    // =====================================
    const courseContent = chapters.map(
      (chapter) => {
        return {
          ...chapter,
          lessons: formattedLessons.filter(
            (lesson) =>
              lesson.chapter_id === chapter.id
          ),
        };
      }
    );

    // =====================================
    // RESPONSE
    // =====================================
    return res.status(200).json({
      success: true,
      data: {
        ...course,
        purchaseStatus,
        chapters: courseContent,
      },
    });
  } catch (error) {
    console.error(
      "getLearningCoursesViaId Error =>",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load course details right now. Please try again later.",
    });
  }
};
//Get Events

exports.getAppEvents = async (req, res) => {
  try {
    const [events] = await pool.query(
      `SELECT *
       FROM events`
    );

    return res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error("[getAppEvents]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch events slides",
    });
  }
}

exports.getBlogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      forHome,
      category_id,
      search,
    } = req.query;

    let whereClause = `WHERE b.status = 1`;
    const params = [];

    // Category Filter
    if (category_id) {
      whereClause += ` AND b.category_id = ?`;
      params.push(category_id);
    }

    // Search Filter
    if (search && search.trim()) {
      whereClause += `
        AND (
          b.name LIKE ?
          OR b.short_content LIKE ?
          OR b.slug LIKE ?
        )
      `;

      const keyword = `%${search.trim()}%`;
      params.push(keyword, keyword, keyword);
    }

    let sql = `
      SELECT
        b.id,
        b.category_id,
        b.user_id,
        b.name,
        b.slug,
        b.short_content,
        b.image,
        b.created_at,
        c.name AS category_name,
        c.slug AS category_slug
      FROM blogs b
      LEFT JOIN categories c
        ON c.id = b.category_id
      ${whereClause}
    `;

    // Home API
    if (forHome === "true") {
      sql += ` ORDER BY b.id DESC LIMIT 10`;
    } else {
      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
      const offset = (pageNum - 1) * limitNum;

      sql += ` ORDER BY b.id DESC LIMIT ? OFFSET ?`;
      params.push(limitNum, offset);
    }

    const [blogs] = await pool.query(sql, params);

    const data = blogs.map((blog) => ({
      ...blog,
      image: blog.image
        ? `${process.env.APP_API_URL}${blog.image}`
        : null,
    }));

    // Categories having active blogs only
    const [categories] = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.slug,
        COUNT(b.id) AS blog_count
      FROM categories c
      INNER JOIN blogs b
        ON b.category_id = c.id
      WHERE
        c.status = 1
        AND b.status = 1
      GROUP BY
        c.id,
        c.name,
        c.slug
      ORDER BY
        c.name ASC
    `);

    // Home Response
    if (forHome === "true") {
      return res.status(200).json({
        success: true,
        message: "Blogs fetched successfully.",
        categories,
        data,
      });
    }

    // Count Query
    const countParams = [];

    if (category_id) {
      countParams.push(category_id);
    }

    if (search && search.trim()) {
      const keyword = `%${search.trim()}%`;
      countParams.push(keyword, keyword, keyword);
    }

    const [[{ total }]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM blogs b
      ${whereClause}
      `,
      countParams
    );

    return res.status(200).json({
      success: true,
      message: "Blogs fetched successfully.",
      categories,
      data,
      pagination: {
        total,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10,
        totalPages: Math.ceil(total / (parseInt(limit, 10) || 10)),
      },
    });
  } catch (error) {
    console.error("getBlogs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.singleBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const [blogs] = await pool.query(
      `
      SELECT *
      FROM blogs
      WHERE id = ? AND status = 1
      LIMIT 1
      `,
      [id]
    );

    if (blogs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Blog not found.",
      });
    }

    const blog = {
      ...blogs[0],
      image: blogs[0].image
        ? `${process.env.APP_API_URL}${blogs[0].image}`
        : null,
    };

    return res.status(200).json({
      success: true,
      message: "Blog fetched successfully.",
      data: blog,
    });
  } catch (error) {
    console.error("singleBlog Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
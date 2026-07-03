const getPool = require("../config/db");
const zoomService = require("../utils/zoomService");
const pool = getPool();
const axios = require("axios");


exports.getAllBundleCourses = async (req, res) => {
    try {

        // All Bundles
        const [bundles] = await pool.query(`
    SELECT
        id,
        title,
        slug,
        thumbnail,
        short_description,
        price,
        is_free,
        has_discount,
        discount_price,
        status
    FROM course_bundles
    WHERE status = 1
    ORDER BY id ASC
`);
        // All Bundle -> Course Mapping
        const [bundleCourses] = await pool.query(`
            SELECT
                bc.bundle_id,
                c.*
            FROM bundle_courses bc
            INNER JOIN learning_courses c
                ON c.id = bc.course_id
            ORDER BY bc.bundle_id,c.id
        `);

        // Group courses by bundle_id
        const courseMap = {};

        bundleCourses.forEach(course => {

            if (!courseMap[course.bundle_id]) {
                courseMap[course.bundle_id] = [];
            }

            courseMap[course.bundle_id].push({
                id: course.id,
                title: course.title,
                slug: course.slug,
                thumbnail: course.thumbnail,
                short_description: course.short_description,
                price: course.price,
                is_free: course.is_free,
                has_discount: course.has_discount,
                discount_price: course.discount_price,
                status: course.status
            });

        });

        const bundleImageBaseUrl = `https://efos.in/public/`;

        const data = bundles.map(bundle => ({
            ...bundle,
            thumbnail: bundle.thumbnail
                ? bundleImageBaseUrl + bundle.thumbnail
                : null,
            courses: courseMap[bundle.id] || []
        }));

        return res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error("[getAllBundleCourses]", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch bundles."
        });

    }
};


exports.getSingleBundle = async (req, res) => {
    try {
        const { id } = req.params;

        const bundleImageBaseUrl = "https://efos.in/public/";

        // Fetch Bundle
        const [[bundle]] = await pool.query(
            `SELECT *
             FROM course_bundles
             WHERE id = ? AND status = 1
             LIMIT 1`,
            [id]
        );

        if (!bundle) {
            return res.status(404).json({
                success: false,
                message: "Bundle not found."
            });
        }

        // Fetch Courses of Bundle
        const [courses] = await pool.query(
            `SELECT
                c.*
            FROM bundle_courses bc
            INNER JOIN learning_courses c
                ON c.id = bc.course_id
            WHERE bc.bundle_id = ?
            ORDER BY c.id ASC`,
            [id]
        );

        const data = {
            ...bundle,
            thumbnail: bundle.thumbnail
                ? bundleImageBaseUrl + bundle.thumbnail
                : null,

            courses: courses.map(course => ({
                ...course,
                thumbnail: course.thumbnail
                    ? bundleImageBaseUrl + course.thumbnail
                    : null
            }))
        };

        return res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error("[getSingleBundle]", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch bundle."
        });

    }
};
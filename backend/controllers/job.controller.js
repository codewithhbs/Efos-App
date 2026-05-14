const getPool = require("../config/db");
const pool = getPool();



exports.getJobCategories = async (req, res) => {
    try {
        const [categories] = await pool.query(
            `SELECT *
            FROM job_categories
            WHERE status = 1`
        );
        return res.json({
            success: true,
            count: categories.length,
            data: categories,
        });

    } catch (error) {
        return res.json({
            success: false,
            message: error
        });
    }
}

exports.findJobs = async (req, res) => {
    try {
        const {
            is_featured = 1,
            status = 1,
            limit = 5,
            category,
            sub_category,
            page = 1,
        } = req.query;

        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        const offset = (parsedPage - 1) * parsedLimit;

        // ==================================
        // DYNAMIC WHERE CLAUSE
        // ==================================
        let whereClause = `WHERE status = ? AND is_featured = ?`;
        const queryParams = [status, is_featured];

        // First Priority = job_category_id
        if (category) {
            whereClause += ` AND job_category_id = ?`;
            queryParams.push(category);
        }

        // Second Priority = job_sub_category_id
        else if (sub_category) {
            whereClause += ` AND job_sub_category_id = ?`;
            queryParams.push(sub_category);
        }

        // ==================================
        // GET JOBS
        // ==================================
        const [jobs] = await pool.query(
            `
            SELECT
                id,
                title,
                company_logo,
                company_name,
                salary,
                work_mode,
                education,
                short_description,
                slug,
                job_category_id,
                job_sub_category_id,
                created_at
            FROM jobs
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            `,
            [...queryParams, parsedLimit, offset]
        );

        // ==================================
        // NO JOBS FOUND
        // ==================================
        if (!jobs.length) {
            return res.status(200).json({
                success: true,
                count: 0,
                page: parsedPage,
                data: [],
                message: "No jobs found",
            });
        }

        const baseUrl =
            process.env.APP_API_URL || "";

        // default false
        jobs.forEach((job) => {
            job.is_applied = false;
        });

        // ==================================
        // CHECK APPLIED JOBS
        // ==================================
        if (req.user && req.user.id) {
            const userId = req.user.id;

            const [students] = await pool.query(
                `
                SELECT id
                FROM students
                WHERE user_id = ?
                LIMIT 1
                `,
                [userId]
            );

            if (students.length > 0) {
                const studentId =
                    students[0].id;

                const jobIds = jobs.map(
                    (job) => job.id
                );

                const [applications] =
                    await pool.query(
                        `
                        SELECT job_id
                        FROM job_applications
                        WHERE student_id = ?
                        AND job_id IN (?)
                        `,
                        [studentId, jobIds]
                    );

                const appliedIds =
                    applications.map(
                        (item) =>
                            item.job_id
                    );

                jobs.forEach((job) => {
                    job.is_applied =
                        appliedIds.includes(
                            job.id
                        );
                });
            }
        }

        // ==================================
        // FORMAT DATA
        // ==================================
        const formatted = jobs.map(
            (job) => ({
                ...job,
                company_logo:
                    job.company_logo
                        ? job.company_logo.startsWith(
                            "http"
                        )
                            ? job.company_logo
                            : `${baseUrl}/${job.company_logo}`
                        : null,
            })
        );

        // ==================================
        // RESPONSE
        // ==================================
        return res.status(200).json({
            success: true,
            count: formatted.length,
            page: parsedPage,
            limit: parsedLimit,
            data: formatted,
        });

    } catch (error) {
        console.error(
            "FindJobs Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Something went wrong",
            error:
                process.env.NODE_ENV ===
                    "development"
                    ? error.message
                    : undefined,
        });
    }
};
exports.findOneJob = async (req, res) => {
    try {
        const { slug } = req.params;

        // Get Job
        const [jobs] = await pool.query(
            `SELECT *
             FROM jobs
             WHERE slug = ? AND status = 1`,
            [slug]
        );

        if (!jobs.length) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        const job = jobs[0];

        // Company Logo URL
        const baseUrl = process.env.APP_API_URL || '';

        job.company_logo = job.company_logo
            ? job.company_logo.startsWith("http")
                ? job.company_logo
                : `${baseUrl}/${job.company_logo}`
            : null;

        // Default
        job.is_applied = false;

        // If user logged in
        if (req.user && req.user.id) {
            const userId = req.user.id;

            // Find Student by User ID
            const [students] = await pool.query(
                `SELECT id
                 FROM students
                 WHERE user_id = ?
                 LIMIT 1`,
                [userId]
            );

            if (students.length) {
                const studentId = students[0].id;

                // Check Applied
                const [applications] = await pool.query(
                    `SELECT id
                     FROM job_applications
                     WHERE job_id = ? AND student_id = ?
                     LIMIT 1`,
                    [job.id, studentId]
                );


                job.is_applied = applications.length > 0;
            }
        }

        return res.status(200).json({
            success: true,
            data: job
        });

    } catch (error) {
        console.error("FindOneJob Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
};


exports.applyJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        console.log("ApplyJob called with jobId:", jobId, "userId:", userId);

        // Find Student
        const [students] = await pool.query(
            `SELECT
                id,
                name,
                phone,
                email,
                state,
                district,
                highest_qualification,
                photo,
                profile_completed
             FROM students
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        if (!students.length) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found"
            });
        }

        const student = students[0];
        const studentId = student.id;

        // Check Minimal Required Fields
        const missingFields = [];

        if (!student.name) missingFields.push("name");
        if (!student.phone) missingFields.push("phone");
        if (!student.email) missingFields.push("email");
        if (!student.state) missingFields.push("state");
        if (!student.district) missingFields.push("district");
        if (!student.highest_qualification) {
            missingFields.push("highest_qualification");
        }


        if (missingFields.length > 0) {
            return res.status(422).json({
                success: false,
                message: "Please complete your profile before applying.",
                missing_fields: missingFields
            });
        }

        // Check Job Exists
        const [jobs] = await pool.query(
            `SELECT
                id,
                title,
                company_name,
                district,
                state
             FROM jobs
             WHERE id = ? AND status = 1
             LIMIT 1`,
            [jobId]
        );

        if (!jobs.length) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        const job = jobs[0];

        // Check Already Applied
        const [applications] = await pool.query(
            `SELECT id
             FROM job_applications
             WHERE job_id = ? AND student_id = ?
             LIMIT 1`,
            [jobId, studentId]
        );

        if (applications.length) {
            return res.status(400).json({
                success: false,
                message: "You have already applied for this job"
            });
        }

        // Apply Job
        await pool.query(
            `INSERT INTO job_applications
            (
                student_id,
                job_id,
                job_title,
                company_name,
                district,
                state,
                status,
                applied_at,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
            [
                studentId,
                job.id,
                job.title,
                job.company_name,
                job.district,
                job.state,
                1
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Applied successfully"
        });

    } catch (error) {
        console.error("ApplyJob Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
};
const getPool = require("../config/db");
const zoomService = require("../utils/zoomService");
const pool = getPool();
const axios = require("axios");



exports.getQuizQuestionAndOptions = async (req, res) => {
    try {
        const { quizId } = req.params;

        // Validation
        if (!quizId) {
            return res.status(400).json({
                success: false,
                message: "quizId is required",
            });
        }

        // ================================
        // Get Quiz Details
        // ================================
        const [quizRows] = await pool.query(
            `SELECT *
             FROM quizzes
             WHERE id = ?
             AND is_active = 1
             LIMIT 1`,
            [quizId]
        );

        if (quizRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found",
            });
        }

        const quiz = quizRows[0];

        // ================================
        // Get Questions
        // ================================
        const [questions] = await pool.query(
            `SELECT *
             FROM quiz_questions
             WHERE quiz_id = ?
             AND status = 1
             ORDER BY id ASC`,
            [quizId]
        );

        // ================================
        // Get Options for each Question
        // ================================
        const formattedQuestions = await Promise.all(
            questions.map(async (question) => {

                const [options] = await pool.query(
                    `SELECT
                        id,
                        question_id,
                        option_text,
                        is_correct
                     FROM quiz_options
                     WHERE question_id = ?
                     ORDER BY id ASC`,
                    [question.id]
                );

                return {
                    ...question,

                    duration: quiz?.duration_minutes,
                    // Frontend flags
                    selected_option: null,
                    is_answered: false,
                    is_correct_answer: false,

                    options,
                };
            })
        );

        // ================================
        // Final Response
        // ================================
        return res.status(200).json({
            success: true,

            quiz: {
                ...quiz,

                // Quiz flags
                total_questions: formattedQuestions.length,
                attempted_questions: 0,
                completed: false,

                questions: formattedQuestions,
            },
        });

    } catch (error) {
        console.error(
            "getQuizQuestionAndOptions error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
};


exports.submitAnswers = async (req, res) => {
    const connection = await pool.getConnection();

    try {

        const { quizId } = req.params;

        const {
            answers,
            time_taken,
            submit_type = "manual",
        } = req.body;

        const userId = req.user.id;

        // =========================
        // VALIDATION
        // =========================

        if (!Array.isArray(answers) || answers.length === 0) {
            return res.status(422).json({
                success: false,
                message: "Answers are required",
            });
        }

        if (!time_taken || isNaN(time_taken)) {
            return res.status(422).json({
                success: false,
                message: "Time taken is required",
            });
        }

        // =========================
        // CHECK ALREADY SUBMITTED
        // =========================
        let allowedLimit = 10;

        const [existingResult] = await connection.query(
            `SELECT id 
     FROM quiz_results
     WHERE user_id = ? AND quiz_id = ?`,
            [userId, quizId]
        );

        if (existingResult.length >= allowedLimit) {

            return res.status(409).json({
                success: false,
                message: `You have reached the maximum limit of ${allowedLimit} quiz attempts.`,
            });
        }

        await connection.beginTransaction();

        let certificateGenerated = false;
        let score = 0;

        // =========================
        // GET QUESTIONS
        // =========================

        const [questions] = await connection.query(
            `SELECT *
             FROM quiz_questions
             WHERE quiz_id = ?
             ORDER BY id ASC`,
            [quizId]
        );

        const totalQuestions = questions.length;
        const answeredQuestions = answers.filter(Boolean).length;

        // =========================
        // CREATE QUIZ RESULT
        // =========================

        const [quizResultInsert] = await connection.query(
            `INSERT INTO quiz_results
            (
                user_id,
                quiz_id,
                answers,
                total_questions,
                answered_questions,
                time_taken,
                submit_type,
                submitted_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                userId,
                quizId,
                JSON.stringify(answers),
                totalQuestions,
                answeredQuestions,
                time_taken,
                submit_type,
            ]
        );

        // IMPORTANT
        // This is your attempt_id
        const attemptId = quizResultInsert.insertId;

        // =========================
        // SAVE ANSWERS
        // =========================

        for (let index = 0; index < questions.length; index++) {

            const question = questions[index];
            const optionId = answers[index] || null;

            if (!optionId) {
                continue;
            }

            // Find selected option
            const [options] = await connection.query(
                `SELECT *
                 FROM quiz_options
                 WHERE id = ? AND question_id = ?
                 LIMIT 1`,
                [optionId, question.id]
            );

            if (options.length === 0) {
                continue;
            }

            const option = options[0];

            const isCorrect = option.is_correct ? 1 : 0;

            if (isCorrect) {
                score++;
            }

            // Save answer
            await connection.query(
                `INSERT INTO quiz_answers
                (
                    attempt_id,
                    question_id,
                    selected_option_id,
                    is_correct
                )
                VALUES (?, ?, ?, ?)`,
                [
                    attemptId,
                    question.id,
                    option.id,
                    isCorrect,
                ]
            );
        }

        // =========================
        // PASS CALCULATION
        // =========================

        const passPercentage = 50;

        const requiredCorrect = Math.ceil(
            (totalQuestions * passPercentage) / 100
        );

        const isPassed = score >= requiredCorrect;

        // =========================
        // UPDATE RESULT
        // =========================

        await connection.query(
            `UPDATE quiz_results
             SET score = ?, is_passed = ?
             WHERE id = ?`,
            [
                score,
                isPassed ? 1 : 0,
                attemptId,
            ]
        );

        // =========================
        // GET QUIZ COURSE
        // =========================

        const [quizRows] = await connection.query(
            `SELECT * FROM quizzes WHERE id = ? LIMIT 1`,
            [quizId]
        );

        const quiz = quizRows[0];

        // =========================
        // CERTIFICATE LOGIC
        // =========================

        if (isPassed) {

            // Get all quizzes of course
            const [courseQuizzes] = await connection.query(
                `SELECT id
                 FROM quizzes
                 WHERE course_id = ?
                 ORDER BY id ASC`,
                [quiz.course_id]
            );

            const courseQuizIds = courseQuizzes.map(q => q.id);

            const lastQuizId =
                courseQuizIds[courseQuizIds.length - 1];

            // Passed quizzes count
            const [passedQuizCountRows] = await connection.query(
                `SELECT COUNT(DISTINCT quiz_id) as total
                 FROM quiz_results
                 WHERE user_id = ?
                 AND quiz_id IN (?)
                 AND is_passed = 1`,
                [userId, courseQuizIds]
            );

            const passedQuizCount =
                passedQuizCountRows[0].total;

            const totalQuizCount = courseQuizIds.length;

            const allQuizzesPassed =
                passedQuizCount === totalQuizCount;

            const isLastQuiz =
                Number(quizId) === Number(lastQuizId);

            // =========================
            // LESSON COMPLETION
            // =========================

            const [lessonRows] = await connection.query(
                `SELECT COUNT(*) as total
                 FROM course_lessons
                 WHERE course_id = ?
                 AND status = 1`,
                [quiz.course_id]
            );

            const totalLessons = lessonRows[0].total;

            const [completedLessonRows] = await connection.query(
                `SELECT COUNT(*) as total
                 FROM lesson_progress
                 WHERE user_id = ?
                 AND course_id = ?
                 AND is_completed = 1`,
                [userId, quiz.course_id]
            );

            const completedLessons =
                completedLessonRows[0].total;

            const allLessonsCompleted =
                totalLessons > 0 &&
                totalLessons === completedLessons;

            // =========================
            // FINAL CERTIFICATE CHECK
            // =========================

            if (
                allQuizzesPassed &&
                isLastQuiz &&
                allLessonsCompleted
            ) {

                // Get student
                const [students] = await connection.query(
                    `SELECT *
                     FROM students
                     WHERE user_id = ?
                     LIMIT 1`,
                    [userId]
                );

                if (students.length > 0) {

                    const student = students[0];

                    // Check existing certificate
                    const [existingCertificates] =
                        await connection.query(
                            `SELECT id
                             FROM certificates
                             WHERE student_id = ?
                             AND course_id = ?
                             LIMIT 1`,
                            [
                                student.id,
                                quiz.course_id,
                            ]
                        );

                    if (existingCertificates.length === 0) {

                        await connection.query(
                            `INSERT INTO certificates
                            (
                                course_id,
                                student_id,
                                certificate_number,
                                issue_date
                            )
                            VALUES (?, ?, ?, NOW())`,
                            [
                                quiz.course_id,
                                student.id,
                                student.registration_number,
                            ]
                        );

                        certificateGenerated = true;
                    }
                }
            }
        }

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Quiz submitted successfully",
            total_questions: totalQuestions,
            answered_questions: answeredQuestions,
            score,
            is_passed: isPassed,
            certificate_generated: certificateGenerated,
            time_taken,
        });

    } catch (error) {

        await connection.rollback();

        console.error("Quiz submission failed:", error);

        return res.status(500).json({
            success: false,
            message:
                "Something went wrong while submitting the quiz.",
        });

    } finally {
        connection.release();
    }
};
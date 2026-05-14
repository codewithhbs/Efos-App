import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Alert,
    Animated,
    StatusBar,

} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import API from "../../utils/axiosInstanct";

// ─── helpers ──────────────────────────────────────────────────────────────────

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
};

// ─── rules modal ───────────────────────────────────────────────────────────────

const RULES = [
    { icon: "📋", title: "One Question at a Time", desc: "Questions appear one by one. Navigate using Prev / Next buttons." },
    { icon: "🔀", title: "Randomised Order", desc: "Questions and options are shuffled on every attempt." },
    { icon: "⏱", title: "Timer Runs", desc: "Timer starts the moment you accept these rules and begin the quiz." },
    { icon: "✏️", title: "Change Answers", desc: "You can revisit and change any answer before final submission." },
    { icon: "🚫", title: "No Cheating", desc: "Do not use external resources. Results are recorded accurately." },
    { icon: "✅", title: "Submit When Ready", desc: "Press Submit Quiz on the last question or use 'Submit Early' anytime." },
];

function RulesModal({ quiz, onAccept, onDecline }) {
    const slideAnim = useRef(new Animated.Value(300)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleDecline = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
        ]).start(() => onDecline());
    };

    return (
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
            <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>

                {/* handle */}
                <View style={styles.modalHandle} />

                {/* header */}
                <View style={styles.modalHeader}>
                    <View style={styles.modalIconBg}>
                        <Text style={styles.modalIcon}>📜</Text>
                    </View>
                    <Text style={styles.modalTitle}>Quiz Rules</Text>
                    {quiz?.title ? (
                        <Text style={styles.modalSubtitle} numberOfLines={2}>{quiz.title}</Text>
                    ) : null}
                </View>

                {/* meta chips */}
                <View style={styles.metaRow}>
                    {quiz?.total_questions ? (
                        <View style={styles.metaChip}>
                            <Text style={styles.metaChipText}>❓ {quiz.total_questions} Questions</Text>
                        </View>
                    ) : null}
                    {quiz?.passing_marks ? (
                        <View style={styles.metaChip}>
                            <Text style={styles.metaChipText}>🎯 Pass: {quiz.passing_marks}%</Text>
                        </View>
                    ) : null}
                    {quiz?.duration_minutes ? (
                        <View style={styles.metaChip}>
                            <Text style={styles.metaChipText}>⏱ {quiz.duration_minutes} min</Text>
                        </View>
                    ) : null}
                </View>

                {/* rules list */}
                <ScrollView
                    style={styles.rulesList}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 8 }}
                >
                    {RULES.map((rule, i) => (
                        <View key={i} style={styles.ruleItem}>
                            <View style={styles.ruleIconBox}>
                                <Text style={styles.ruleIcon}>{rule.icon}</Text>
                            </View>
                            <View style={styles.ruleTextBox}>
                                <Text style={styles.ruleTitle}>{rule.title}</Text>
                                <Text style={styles.ruleDesc}>{rule.desc}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* disclaimer */}
                <View style={styles.disclaimer}>
                    <Text style={styles.disclaimerText}>
                        By tapping <Text style={{ fontWeight: "700", color: RED }}>I Agree & Start</Text>, you confirm you have read and accept all the rules above.
                    </Text>
                </View>

                {/* buttons */}
                <View style={styles.modalBtns}>
                    <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
                        <Text style={styles.declineBtnText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
                        <Text style={styles.acceptBtnText}>I Agree & Start</Text>
                    </TouchableOpacity>
                </View>

            </Animated.View>
        </Animated.View>
    );
}

// ─── result screen ─────────────────────────────────────────────────────────────

function ResultScreen({ result, total, onBack }) {
    const pct = Math.round((result.score / total) * 100);
    const scoreAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(scoreAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#C0392B" />
            <View style={styles.resultContainer}>
                <Animated.View style={[styles.resultCard, { opacity: scoreAnim, transform: [{ scale: scoreAnim }] }]}>
                    <Text style={styles.resultEmoji}>{result.is_passed ? "🏆" : "📝"}</Text>
                    <Text style={styles.resultTitle}>{result.is_passed ? "Passed!" : "Not Passed"}</Text>

                    <View style={styles.scoreBubble}>
                        <Text style={styles.scoreBig}>{result.score}</Text>
                        <Text style={styles.scoreOf}>/ {result.total_questions}</Text>
                    </View>

                    <Text style={styles.scorePct}>{pct}%</Text>

                    <View style={styles.resultStats}>
                        <View style={styles.resultStat}>
                            <Text style={styles.resultStatVal}>{result.answered_questions}</Text>
                            <Text style={styles.resultStatLabel}>Answered</Text>
                        </View>
                        <View style={styles.resultStatDivider} />
                        <View style={styles.resultStat}>
                            <Text style={styles.resultStatVal}>{formatTime(result.time_taken)}</Text>
                            <Text style={styles.resultStatLabel}>Time Taken</Text>
                        </View>
                        <View style={styles.resultStatDivider} />
                        <View style={styles.resultStat}>
                            <Text style={styles.resultStatVal}>{result.certificate_generated ? "Yes" : "No"}</Text>
                            <Text style={styles.resultStatLabel}>Certificate</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                        <Text style={styles.backBtnText}>Done</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

// ─── main screen ───────────────────────────────────────────────────────────────

export default function QuizPlayScreen({ route, navigation }) {
    const { quizId } = route.params || {};

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [quizze, setQuizze] = useState(null);
    const [shuffledQuestions, setShuffledQuestions] = useState([]);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [result, setResult] = useState(null);
    const [rulesAccepted, setRulesAccepted] = useState(false);

    const slideAnim = useRef(new Animated.Value(0)).current;
    const timerRef = useRef(null);
    const elapsedRef = useRef(0);

    // ── timer ──────────────────────────────────────────────────────────────────

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            elapsedRef.current += 1;
            setElapsed(elapsedRef.current);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    useEffect(() => () => stopTimer(), []);

    // ── fetch ──────────────────────────────────────────────────────────────────

    const fetchQuizes = async () => {
        try {
            setLoading(true);
            const res = await API.get(`/quiz/quiz-details/${quizId}`);
            if (res.data?.success) {
                const quiz = res.data.quiz;
                setQuizze(quiz);

                // shuffle questions + their options
                const sq = shuffle(quiz.questions).map((q) => ({
                    ...q,
                    options: shuffle(q.options),
                }));
                setShuffledQuestions(sq);

                const preSelected = {};
                quiz.questions.forEach((q) => {
                    if (q.selected_option) preSelected[q.id] = q.selected_option;
                });
                setSelectedAnswers(preSelected);
                // timer starts only after user accepts rules
            }
        } catch (error) {
            console.log("Quiz Error:", error?.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    // ── select option ──────────────────────────────────────────────────────────

    const handleSelectOption = (questionId, optionId) => {
        setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    };

    // ── navigate questions ─────────────────────────────────────────────────────

    const animateTransition = (dir, cb) => {
        Animated.sequence([
            Animated.timing(slideAnim, {
                toValue: dir === "next" ? -30 : 30,
                duration: 120,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: dir === "next" ? 30 : -30,
                duration: 0,
                useNativeDriver: true,
            }),
        ]).start(() => {
            cb();
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start();
        });
    };

    const goNext = () => {
        if (currentIndex < shuffledQuestions.length - 1) {
            animateTransition("next", () => setCurrentIndex((i) => i + 1));
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            animateTransition("prev", () => setCurrentIndex((i) => i - 1));
        }
    };

    // ── submit ─────────────────────────────────────────────────────────────────

    const handleSubmitQuiz = async () => {
        Alert.alert(
            "Submit Quiz?",
            `You've answered ${answeredCount} of ${shuffledQuestions.length} questions.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Submit",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setSubmitting(true);
                            stopTimer();

                            const formattedAnswers = quizze.questions.map(
                                (q) => selectedAnswers[q.id] || null
                            );

                            const payload = {
                                answers: formattedAnswers,
                                time_taken: elapsedRef.current,
                                submit_type: "manual",
                            };

                            const res = await API.post(`/quiz/submit-quiz/${quizId}`, payload);

                            if (res.data?.success) {
                                setResult(res.data);
                            }
                        } catch (error) {
                            startTimer();
                            Alert.alert(
                                "Error",
                                error?.response?.data?.message || "Something went wrong"
                            );
                        } finally {
                            setSubmitting(false);
                        }
                    },
                },
            ]
        );
    };

    // ── derived ────────────────────────────────────────────────────────────────

    const answeredCount = useMemo(
        () => Object.keys(selectedAnswers).length,
        [selectedAnswers]
    );

    const progress = shuffledQuestions.length
        ? (currentIndex + 1) / shuffledQuestions.length
        : 0;

    const currentQuestion = shuffledQuestions[currentIndex];
    const isLastQuestion = currentIndex === shuffledQuestions.length - 1;
    const timerDanger = elapsed > 0 && quizze && elapsed >= quizze.duration_seconds * 0.8;

    // ── effects ────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (quizId) fetchQuizes();
    }, [quizId]);

    // ── result screen ──────────────────────────────────────────────────────────

    if (result) {
        return (
            <ResultScreen
                result={result}
                total={quizze?.total_questions || shuffledQuestions.length}
                onBack={() => navigation.goBack()}
            />
        );
    }

    // ── loading ────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#C0392B" />
                <Text style={styles.loadingText}>Loading quiz...</Text>
            </View>
        );
    }

    if (!quizze || !currentQuestion) {
        return (
            <View style={styles.loaderContainer}>
                <Text style={styles.errorText}>No quiz found</Text>
            </View>
        );
    }

    // ── rules gate ─────────────────────────────────────────────────────────────

    if (!rulesAccepted) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: "#111" }]}>
                <StatusBar barStyle="light-content" backgroundColor="#111" />
                {/* dim bg preview */}
                <View style={styles.rulesBackground}>
                    <View style={styles.rulesBgTopBar} />
                    <View style={styles.rulesBgContent} />
                </View>
                <RulesModal
                    quiz={quizze}
                    onAccept={() => {
                        setRulesAccepted(true);
                        startTimer();
                    }}
                    onDecline={() => navigation.goBack()}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#C0392B" />

            {/* ── TOP BAR ── */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.exitText}>✕</Text>
                </TouchableOpacity>

                <View style={styles.progressInfo}>
                    <Text style={styles.progressLabel}>
                        {currentIndex + 1} / {shuffledQuestions.length}
                    </Text>
                </View>

                <View style={[styles.timerPill, timerDanger && styles.timerPillDanger]}>
                    <Text style={styles.timerIcon}>⏱</Text>
                    <Text style={[styles.timerText, timerDanger && styles.timerTextDanger]}>
                        {formatTime(elapsed)}
                    </Text>
                </View>
            </View>

            {/* ── PROGRESS BAR ── */}
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>

            {/* ── ANSWERED CHIP ── */}
            <View style={styles.answeredRow}>
                <View style={styles.answeredChip}>
                    <Text style={styles.answeredChipText}>
                        ✓ {answeredCount} answered
                    </Text>
                </View>
                <View style={styles.unansweredChip}>
                    <Text style={styles.unansweredChipText}>
                        {shuffledQuestions.length - answeredCount} remaining
                    </Text>
                </View>
            </View>

            {/* ── QUESTION CARD ── */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Animated.View
                    style={[
                        styles.questionCard,
                        { transform: [{ translateX: slideAnim }] },
                    ]}
                >
                    <View style={styles.questionNumBadge}>
                        <Text style={styles.questionNumText}>Q{currentIndex + 1}</Text>
                    </View>

                    <Text style={styles.questionText}>{currentQuestion.question}</Text>

                    {/* ── OPTIONS ── */}
                    <View style={styles.optionsContainer}>
                        {currentQuestion.options.map((option, idx) => {
                            const isSelected = selectedAnswers[currentQuestion.id] === option.id;
                            const labels = ["A", "B", "C", "D", "E"];

                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[styles.optionBox, isSelected && styles.selectedOption]}
                                    onPress={() => handleSelectOption(currentQuestion.id, option.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                                        <Text style={[styles.optionLabelText, isSelected && styles.optionLabelTextSelected]}>
                                            {labels[idx] || idx + 1}
                                        </Text>
                                    </View>
                                    <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                                        {option.option_text}
                                    </Text>
                                    {isSelected && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            </ScrollView>

            {/* ── BOTTOM NAV ── */}
            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
                    onPress={goPrev}
                    disabled={currentIndex === 0}
                >
                    <Text style={[styles.navBtnText, currentIndex === 0 && styles.navBtnTextDisabled]}>
                        ← Prev
                    </Text>
                </TouchableOpacity>

                {isLastQuestion ? (
                    <TouchableOpacity
                        style={styles.submitBtn}
                        onPress={handleSubmitQuiz}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.submitBtnText}>Submit Quiz →</Text>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
                        <Text style={styles.nextBtnText}>Next →</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* quick submit if not on last question */}
            {!isLastQuestion && (
                <TouchableOpacity
                    style={styles.earlySubmitBtn}
                    onPress={handleSubmitQuiz}
                    disabled={submitting}
                >
                    <Text style={styles.earlySubmitText}>Submit Early</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}

// ─── styles ────────────────────────────────────────────────────────────────────

const RED = "#C0392B";
const RED_DARK = "#96281B";
const RED_LIGHT = "#FADBD8";

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#fff",
    },

    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },

    loadingText: {
        marginTop: 12,
        color: "#666",
        fontSize: 15,
    },

    errorText: {
        color: "#999",
        fontSize: 16,
    },

    // ── top bar ──────────────────────────────────────────────────────────────

    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: RED,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },

    exitBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },

    exitText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },

    progressInfo: {
        alignItems: "center",
    },

    progressLabel: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },

    timerPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },

    timerPillDanger: {
        backgroundColor: "#fff",
    },

    timerIcon: {
        fontSize: 13,
    },

    timerText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
        fontVariant: ["tabular-nums"],
    },

    timerTextDanger: {
        color: RED,
    },

    // ── progress bar ──────────────────────────────────────────────────────────

    progressBarBg: {
        height: 4,
        backgroundColor: "#f0f0f0",
    },

    progressBarFill: {
        height: 4,
        backgroundColor: RED,
    },

    // ── answered row ──────────────────────────────────────────────────────────

    answeredRow: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },

    answeredChip: {
        backgroundColor: "#E8F5E9",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },

    answeredChipText: {
        color: "#2E7D32",
        fontSize: 12,
        fontWeight: "600",
    },

    unansweredChip: {
        backgroundColor: "#f5f5f5",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },

    unansweredChipText: {
        color: "#888",
        fontSize: 12,
        fontWeight: "600",
    },

    // ── scroll + card ─────────────────────────────────────────────────────────

    scrollContent: {
        padding: 16,
        paddingBottom: 20,
    },

    questionCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: "#f0f0f0",
    },

    questionNumBadge: {
        alignSelf: "flex-start",
        backgroundColor: RED,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 14,
    },

    questionNumText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.5,
    },

    questionText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111",
        lineHeight: 27,
        marginBottom: 20,
    },

    // ── options ───────────────────────────────────────────────────────────────

    optionsContainer: {
        gap: 10,
    },

    optionBox: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#E8E8E8",
        borderRadius: 12,
        padding: 14,
        backgroundColor: "#FAFAFA",
        gap: 12,
    },

    selectedOption: {
        backgroundColor: RED,
        borderColor: RED,
    },

    optionLabel: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#fff",
        borderWidth: 1.5,
        borderColor: "#ddd",
        justifyContent: "center",
        alignItems: "center",
    },

    optionLabelSelected: {
        backgroundColor: "rgba(255,255,255,0.3)",
        borderColor: "rgba(255,255,255,0.5)",
    },

    optionLabelText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#555",
    },

    optionLabelTextSelected: {
        color: "#fff",
    },

    optionText: {
        flex: 1,
        fontSize: 15,
        color: "#222",
        lineHeight: 22,
    },

    selectedOptionText: {
        color: "#fff",
        fontWeight: "600",
    },

    checkmark: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },

    // ── bottom nav ────────────────────────────────────────────────────────────

    bottomNav: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: "#eee",
        backgroundColor: "#fff",
        gap: 12,
    },

    navBtn: {
        paddingHorizontal: 20,
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "#222",
        backgroundColor: "#fff",
    },

    navBtnDisabled: {
        borderColor: "#ddd",
    },

    navBtnText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111",
    },

    navBtnTextDisabled: {
        color: "#ccc",
    },

    nextBtn: {
        flex: 1,
        backgroundColor: "#111",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },

    nextBtnText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },

    submitBtn: {
        flex: 1,
        backgroundColor: RED,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },

    submitBtnText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },

    earlySubmitBtn: {
        marginHorizontal: 16,
        marginBottom: 8,
        paddingVertical: 10,
        alignItems: "center",
    },

    earlySubmitText: {
        color: RED,
        fontSize: 13,
        fontWeight: "600",
        textDecorationLine: "underline",
    },

    // ── result screen ─────────────────────────────────────────────────────────

    resultContainer: {
        flex: 1,
        backgroundColor: RED,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },

    resultCard: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 32,
        alignItems: "center",
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
    },

    resultEmoji: {
        fontSize: 56,
        marginBottom: 8,
    },

    resultTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: "#111",
        marginBottom: 20,
    },

    scoreBubble: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 4,
    },

    scoreBig: {
        fontSize: 72,
        fontWeight: "900",
        color: RED,
        lineHeight: 80,
    },

    scoreOf: {
        fontSize: 28,
        fontWeight: "700",
        color: "#999",
    },

    scorePct: {
        fontSize: 20,
        fontWeight: "700",
        color: "#555",
        marginTop: 4,
        marginBottom: 24,
    },

    resultStats: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f8f8",
        borderRadius: 16,
        padding: 16,
        width: "100%",
        marginBottom: 24,
    },

    resultStat: {
        flex: 1,
        alignItems: "center",
    },

    resultStatVal: {
        fontSize: 18,
        fontWeight: "800",
        color: "#111",
    },

    resultStatLabel: {
        fontSize: 11,
        color: "#999",
        marginTop: 2,
        fontWeight: "500",
    },

    resultStatDivider: {
        width: 1,
        height: 32,
        backgroundColor: "#e0e0e0",
    },

    backBtn: {
        backgroundColor: RED,
        width: "100%",
        paddingVertical: 15,
        borderRadius: 14,
        alignItems: "center",
    },

    backBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },

    // ── rules modal ───────────────────────────────────────────────────────────

    rulesBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#111",
    },

    rulesBgTopBar: {
        height: 60,
        backgroundColor: RED,
        opacity: 0.4,
    },

    rulesBgContent: {
        flex: 1,
        backgroundColor: "#111",
    },

    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "flex-end",
    },

    modalSheet: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 32,
        maxHeight: "92%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 20,
    },

    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#ddd",
        alignSelf: "center",
        marginBottom: 20,
    },

    modalHeader: {
        alignItems: "center",
        marginBottom: 16,
    },

    modalIconBg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: RED_LIGHT,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },

    modalIcon: {
        fontSize: 30,
    },

    modalTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111",
        marginBottom: 4,
    },

    modalSubtitle: {
        fontSize: 14,
        color: "#777",
        textAlign: "center",
        lineHeight: 20,
    },

    metaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 16,
        justifyContent: "center",
    },

    metaChip: {
        backgroundColor: "#f5f5f5",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },

    metaChipText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#444",
    },

    rulesList: {
        maxHeight: 280,
    },

    ruleItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 14,
    },

    ruleIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: RED_LIGHT,
        justifyContent: "center",
        alignItems: "center",
        flexShrink: 0,
    },

    ruleIcon: {
        fontSize: 18,
    },

    ruleTextBox: {
        flex: 1,
        paddingTop: 2,
    },

    ruleTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#111",
        marginBottom: 2,
    },

    ruleDesc: {
        fontSize: 13,
        color: "#666",
        lineHeight: 18,
    },

    disclaimer: {
        backgroundColor: "#FEF9E7",
        borderRadius: 10,
        padding: 12,
        marginTop: 12,
        marginBottom: 16,
        borderLeftWidth: 3,
        borderLeftColor: "#F39C12",
    },

    disclaimerText: {
        fontSize: 13,
        color: "#555",
        lineHeight: 19,
    },

    modalBtns: {
        flexDirection: "row",
        gap: 10,
        paddingBottom: 48,
    },

    declineBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#ddd",
        backgroundColor: "#fff",
    },

    declineBtnText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#888",
    },

    acceptBtn: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: "center",
        backgroundColor: RED,
    },

    acceptBtnText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#fff",
    },
});
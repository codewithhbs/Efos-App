import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Animated,
    Modal,
    Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import YoutubeIframe from "react-native-youtube-iframe";
import * as KeepAwake from "expo-keep-awake";
import Layout from "../../components/layout";
import API from "../../utils/axiosInstanct";
import { useCourse } from "../../hooks/useCourse";
import { AuthWarn, Loader } from "../../components/LoadingAndAuthWarn";
import useAuthStore from "../../store/useAuthStore";
import { COLORS } from "../../utils/dummyData";
import WebView from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── helpers ─────────────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get("window");
const isTablet = SW >= 768;
const PLAYER_H = isTablet ? SW * 0.42 : SW * 0.5625;

function extractYTId(url) {
    if (!url) return null;
    const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
}

function fmtDuration(sec) {
    if (!sec) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Text & PDF Modal ─────────────────────────────────────────────────────────
function ContentModal({ visible, onClose, lesson }) {
    const hasPdf = !!lesson?.pdf_file;
    const hasContent = !!lesson?.content;

    const openPdf = async () => {
        try {
            if (lesson?.pdf_file) {
                await Linking.openURL(lesson.pdf_file);
            }
        } catch (error) {
            Alert.alert(
                "Unable to Open PDF",
                "Please try again later."
            );
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.modalWrapper}>
                {/* HEADER */}
                <View style={styles.header}>
                    <Text
                        style={styles.headerTitle}
                        numberOfLines={2}
                    >
                        {lesson?.title}
                    </Text>

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Ionicons
                            name="close"
                            size={24}
                            color="#111"
                        />
                    </TouchableOpacity>
                </View>

                {/* CONTENT */}
                <View style={styles.body}>
                    {hasContent ? (
                        <WebView
                            source={{
                                html: `
                <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <style>
                      body{
                        font-family: Arial;
                        padding:18px;
                        color:#222;
                        font-size:16px;
                        line-height:1.7;
                        background:#ffffff;
                      }
                      img{
                        max-width:100%;
                        height:auto;
                        border-radius:10px;
                      }
                      h1,h2,h3{
                        color:#111;
                      }
                    </style>
                  </head>
                  <body>
                    ${lesson.content}
                  </body>
                </html>
              `,
                            }}
                            style={styles.webview}
                            startInLoadingState={true}
                            renderLoading={() => (
                                <View style={styles.loaderBox}>
                                    <ActivityIndicator
                                        size="large"
                                        color="#2563eb"
                                    />
                                </View>
                            )}
                        />
                    ) : (
                        <View style={styles.emptyBox}>
                            <Ionicons
                                name="document-text-outline"
                                size={50}
                                color="#999"
                            />
                            <Text style={styles.emptyText}>
                                No content available.
                            </Text>
                        </View>
                    )}
                </View>

                {/* FIXED FOOTER BUTTON */}
                {hasPdf && (
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.pdfButton}
                            onPress={openPdf}
                        >
                            <Ionicons
                                name="document"
                                size={20}
                                color="#fff"
                            />
                            <Text style={styles.pdfButtonText}>
                                Open PDF File
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        </Modal>
    );
}

// ─── Lesson Row ───────────────────────────────────────────────────────────────
function LessonRow({ lesson, isActive, onPress, quizzes }) {
    const isVideo = lesson.type === "video";
    const isText = lesson.type === "text";
    const hasPdf = !!lesson.pdf_file;
    const isFree = lesson.is_free_preview === 1;
    const hasQuiz = !!lesson?.quizzes.length > 0
    return (
        <TouchableOpacity
            style={[styles.lessonRow, isActive && styles.lessonRowActive]}
            onPress={() => onPress(lesson)}
            activeOpacity={0.75}
        >
            <View
                style={[
                    styles.lessonIconWrap,
                    isActive && styles.lessonIconWrapActive,
                    !isVideo && styles.lessonIconWrapText,
                ]}
            >
                <Ionicons
                    name={
                        isActive
                            ? "pause"
                            : isVideo
                                ? "play"
                                : "document-text-outline"
                    }
                    size={14}
                    color={
                        isActive
                            ? COLORS.white
                            : isVideo
                                ? COLORS.accent
                                : COLORS.warning
                    }
                />
            </View>

            <View style={styles.lessonMeta}>
                <Text
                    style={[styles.lessonTitle, isActive && styles.lessonTitleActive]}
                    numberOfLines={2}
                >
                    {lesson.title}
                </Text>

                <View style={styles.lessonTags}>
                    <View
                        style={[
                            styles.typeBadge,
                            isVideo ? styles.videoBadge : styles.textBadge,
                        ]}
                    >
                        <Text style={styles.typeBadgeText}>
                            {isVideo ? "VIDEO" : "TEXT"}
                        </Text>
                    </View>

                    {isFree && (
                        <View style={styles.freeBadge}>
                            <Text style={styles.freeBadgeText}>FREE</Text>
                        </View>
                    )}

                    {lesson.duration_seconds > 0 && (
                        <Text style={styles.duration}>
                            {fmtDuration(lesson.duration_seconds)}
                        </Text>
                    )}

                    {hasPdf && (
                        <View style={styles.pdfBadge}>
                            <Text style={styles.pdfBadgeText}>PDF</Text>
                        </View>
                    )}
                </View>
            </View>

            {isActive && <View style={styles.nowPlayingDot} />}
        </TouchableOpacity>
    );
}

// ─── Chapter Accordion ────────────────────────────────────────────────────────
function ChapterAccordion({ chapter, onPlayLesson, activeLesson, navigation ,courseId }) {
    const [open, setOpen] = useState(false);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    const rotateAnim = useRef(new Animated.Value(0)).current;
    const heightAnim = useRef(new Animated.Value(0)).current;

    const toggle = async () => {
        if (!open && !fetched) {
            setLoading(true);
            try {
                const res = await API.get(`/extra/videos/${chapter.id}/${chapter.course_id}`);

                setLessons(res.data.videos || []);
                setFetched(true);
            } catch (e) {
                console.log("Lesson fetch error:", e);
            } finally {
                setLoading(false);
            }
        }

        const toOpen = !open;
        setOpen(toOpen);

        Animated.parallel([
            Animated.timing(rotateAnim, {
                toValue: toOpen ? 1 : 0,
                duration: 220,
                useNativeDriver: true,
            }),
            Animated.timing(heightAnim, {
                toValue: toOpen ? 1 : 0,
                duration: 250,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const chevronRotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "180deg"],
    });

    const isLocked = chapter.is_locked === 1;

    return (
        <View style={styles.chapterWrap}>
            <TouchableOpacity
                style={[
                    styles.chapterHeader,
                    open && styles.chapterHeaderOpen,
                ]}
                onPress={toggle}
                activeOpacity={0.8}
            >
                <View style={styles.chapterLeft}>
                    <View
                        style={[
                            styles.chapterBadge,
                            isLocked && styles.chapterBadgeLocked,
                        ]}
                    >
                        <Ionicons
                            name={isLocked ? "lock-closed" : "play-circle"}
                            size={14}
                            color={
                                isLocked
                                    ? COLORS.textLight
                                    : COLORS.accent
                            }
                        />
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text
                            style={styles.chapterTitle}
                            numberOfLines={2}
                        >
                            {chapter.title}
                        </Text>

                        <Text
                            style={styles.chapterDesc}
                            numberOfLines={1}
                        >
                            {chapter.description}
                        </Text>
                    </View>
                </View>

                <Animated.View
                    style={{
                        transform: [{ rotate: chevronRotate }],
                    }}
                >
                    <Ionicons
                        name="chevron-down"
                        size={18}
                        color={COLORS.textSecondary}
                    />
                </Animated.View>
            </TouchableOpacity>

            {open && (
                <View style={styles.lessonList}>
                    {loading ? (
                        <ActivityIndicator
                            color={COLORS.accent}
                            style={{ paddingVertical: 20 }}
                        />
                    ) : lessons.length === 0 ? (
                        <Text style={styles.emptyText}>
                            No lessons available
                        </Text>
                    ) : (
                        <>
                            {lessons.map((lesson) => (
                                <LessonRow
                                    key={lesson.id}
                                    lesson={lesson}
                                    quizzes={lesson?.quizzes}
                                    isActive={
                                        activeLesson?.id === lesson.id
                                    }
                                    onPress={onPlayLesson}
                                />
                            ))}

                            {/* Show only one quiz button */}
                            {lessons.some(
                                (lesson) => lesson?.quizzes?.length > 0
                            ) && (
                                    <TouchableOpacity
                                        onPress={() =>
                                            navigation.navigate("QuizScreen", {
                                                courseId: courseId
                                               
                                            })
                                        }
                                        style={styles.quizButton}
                                    >
                                        <View style={styles.quizWrap}>
                                            <Text style={styles.quizText}>
                                                Check Quiz
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                        </>
                    )}
                </View>
            )}
        </View>
    );
}

// ─── Main Classroom Screen ────────────────────────────────────────────────────
export default function Classroom({ route, navigation }) {
    const { isAuthenticated } = useAuthStore();
    const { courseId } = route.params;
    const { courseDetails, loading: courseLoading } = useCourse({ id: courseId });

    const [subjects, setSubjects] = useState([]);
    const [subLoading, setSubLoading] = useState(false);

    const [activeLesson, setActiveLesson] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalLesson, setModalLesson] = useState(null);

    const activeVideoId = activeLesson?.type === "video" ? extractYTId(activeLesson.video_url) : null;

    // Fetch chapters and lessons
    useEffect(() => {
        const fetchSubjects = async () => {
            setSubLoading(true);
            try {
                const res = await API.get(`/extra/lessons-chapters/${courseId}`);

                setSubjects(res.data?.chapters || []);
            } catch (e) {
                console.log("Chapters fetch error:", e);
            } finally {
                setSubLoading(false);
            }
        };
        fetchSubjects();
    }, [courseId]);

    // Keep screen awake during video playback
    const onStateChange = useCallback((state) => {
        if (state === "playing") {
            KeepAwake.activateKeepAwakeAsync();
            setPlaying(true);
        } else {
            KeepAwake.deactivateKeepAwake();
            if (state !== "buffering") setPlaying(false);
        }
    }, []);

    const handleLessonPress = (lesson) => {
        if (lesson.type === "video") {
            if (activeLesson?.id === lesson.id) {
                setPlaying((prev) => !prev);
            } else {
                setActiveLesson(lesson);
                setPlaying(true);
                setShowModal(false);
            }
        } else if (lesson.type === "text") {
            setModalLesson(lesson);
            setShowModal(true);
            setActiveLesson(null); // Clear video when opening text/PDF
        }
    };

    if (!isAuthenticated) return <AuthWarn />;
    if (courseLoading) return <Loader />;

    return (
        <Layout
            headerType="backTitle"
            subtitle={courseDetails?.short_description}
            scrollable={true}
            onBack={() => navigation.goBack()}
            title={courseDetails?.title || "Course Classroom"}
        >
            <View style={styles.root}>

                {/* Video Player Section */}
                <View style={styles.playerZone}>
                    {activeVideoId ? (
                        <YoutubeIframe
                            height={PLAYER_H}
                            width={SW}
                            videoId={activeVideoId}
                            play={playing}
                            onChangeState={onStateChange}
                            webViewProps={{
                                allowsFullscreenVideo: true,
                                allowsInlineMediaPlayback: true,
                                mediaPlaybackRequiresUserAction: false,
                            }}
                            initialPlayerParams={{
                                controls: true,
                                modestbranding: true,
                                rel: false,
                            }}
                        />
                    ) : (
                        <View style={styles.playerPlaceholder}>
                            <View style={styles.placeholderIcon}>
                                <Ionicons name="play-circle-outline" size={56} color={COLORS.accent} />
                            </View>
                            <Text style={styles.placeholderTitle}>
                                {courseDetails?.title || "Course Classroom"}
                            </Text>
                            <Text style={styles.placeholderSub}>
                                Select a lesson below to start watching
                            </Text>
                        </View>
                    )}
                </View>

                {/* Now Playing Bar - Video only */}
                {activeLesson?.type === "video" && (
                    <View style={styles.nowPlayingBar}>
                        <View style={styles.nowPlayingIndicator} />
                        <Text style={styles.nowPlayingText} numberOfLines={1}>
                            {activeLesson.title}
                        </Text>
                        <TouchableOpacity
                            onPress={() => setPlaying((p) => !p)}
                            style={styles.miniPlayBtn}
                        >
                            <Ionicons
                                name={playing ? "pause" : "play"}
                                size={16}
                                color={COLORS.accent}
                            />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Course Content Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Course Content</Text>
                    <Text style={styles.sectionCount}>
                        {subjects.length} chapters
                    </Text>
                </View>

                {/* Chapters List */}
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {subLoading ? (
                        <ActivityIndicator
                            color={COLORS.accent}
                            size="large"
                            style={{ marginTop: 40 }}
                        />
                    ) : subjects.length === 0 ? (
                        <Text style={styles.emptyText}>No chapters found</Text>
                    ) : (
                        subjects
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((chapter) => (
                                <ChapterAccordion
                                    key={chapter.id}
                                    navigation={navigation}
                                    courseId={courseId}
                                    chapter={chapter}
                                    activeLesson={activeLesson}
                                    onPlayLesson={handleLessonPress}
                                />
                            ))
                    )}
                </ScrollView>
            </View>

            {/* Text / PDF Modal */}
            <ContentModal
                visible={showModal}
                onClose={() => setShowModal(false)}
                lesson={modalLesson}
            />
        </Layout>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },

    playerZone: {
        width: SW,
        height: PLAYER_H,
        backgroundColor: "#000",
    },
    playerPlaceholder: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.card,
        gap: 10,
    },
    placeholderIcon: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
    },
    placeholderTitle: {
        color: COLORS.text,
        fontSize: isTablet ? 20 : 16,
        fontWeight: "700",
        textAlign: "center",
        paddingHorizontal: 24,
    },
    placeholderSub: {
        color: COLORS.textSecondary,
        fontSize: 13,
        textAlign: "center",
    },

    nowPlayingBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.card,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: 8,
    },
    nowPlayingIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.accent,
    },
    nowPlayingText: {
        flex: 1,
        color: COLORS.accent,
        fontSize: 12,
        fontWeight: "600",
    },
    miniPlayBtn: {
        padding: 4,
    },

    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.card,
    },
    sectionTitle: {
        color: COLORS.text,
        fontWeight: "700",
        fontSize: 15,
    },
    sectionCount: {
        color: COLORS.textLight,
        fontSize: 12,
    },

    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 32,
    },

    chapterWrap: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    chapterHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: COLORS.card,
    },
    chapterHeaderOpen: {
        backgroundColor: COLORS.bg,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.accent,
    },
    chapterLeft: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginRight: 8,
    },
    chapterBadge: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: COLORS.accent + "44",
    },
    chapterBadgeLocked: {
        borderColor: COLORS.border,
        backgroundColor: COLORS.card,
    },
    chapterTitle: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: "600",
        lineHeight: 20,
    },
    chapterDesc: {
        color: COLORS.textSecondary,
        fontSize: 11,
        marginTop: 2,
    },

    lessonList: {
        backgroundColor: COLORS.bg,
        paddingLeft: 12,
    },
    lessonRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: 12,
    },
    lessonRowActive: {
        backgroundColor: COLORS.primaryLight,
        borderLeftWidth: 2,
        borderLeftColor: COLORS.accent,
    },
    lessonIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: COLORS.accent + "33",
    },
    lessonIconWrapActive: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },
    lessonIconWrapText: {
        borderColor: COLORS.warning + "44",
    },
    lessonMeta: {
        flex: 1,
    },
    lessonTitle: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: "500",
        lineHeight: 18,
    },
    lessonTitleActive: {
        color: COLORS.accent,
        fontWeight: "700",
    },
    lessonTags: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5,
        gap: 6,
        flexWrap: "wrap",
    },
    typeBadge: {
        borderRadius: 4,
        paddingVertical: 2,
        paddingHorizontal: 6,
    },
    videoBadge: {
        backgroundColor: COLORS.accent + "22",
    },
    textBadge: {
        backgroundColor: COLORS.warning + "22",
    },
    typeBadgeText: {
        fontSize: 9,
        fontWeight: "700",
        color: COLORS.textSecondary,
        letterSpacing: 0.5,
    },
    freeBadge: {
        backgroundColor: COLORS.success + "22",
        borderRadius: 4,
        paddingVertical: 2,
        paddingHorizontal: 6,
    },
    freeBadgeText: {
        fontSize: 9,
        fontWeight: "700",
        color: COLORS.success,
        letterSpacing: 0.5,
    },
    duration: {
        color: COLORS.textLight,
        fontSize: 11,
    },
    pdfBadge: {
        backgroundColor: COLORS.primaryLight,
        borderRadius: 4,
        paddingVertical: 2,
        paddingHorizontal: 6,
    },
    pdfBadgeText: {
        fontSize: 9,
        fontWeight: "700",
        color: COLORS.primary,
        letterSpacing: 0.5,
    },
    nowPlayingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.accent,
    },

    emptyText: {
        color: COLORS.textLight,
        textAlign: "center",
        paddingVertical: 20,
        fontSize: 13,
    },

    // Modal Styles

    modalWrapper: {
        flex: 1,
        backgroundColor: "#fff",
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        backgroundColor: "#fff",
    },

    headerTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: "700",
        color: "#111",
        marginRight: 12,
    },
    quizButton: {
        marginTop: 14,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 7,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
    },

    quizWrap: {
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
    },

    quizText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textPrimary,
    },
    closeButton: {
        width: 38,
        height: 38,
        borderRadius: 20,
        backgroundColor: "#f3f4f6",
        alignItems: "center",
        justifyContent: "center",
    },

    body: {
        flex: 1,
        backgroundColor: "#fff",
    },

    webview: {
        flex: 1,
        backgroundColor: "#fff",
    },

    loaderBox: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    emptyBox: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },

    emptyText: {
        marginTop: 10,
        fontSize: 15,
        color: "#666",
    },

    footer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: "#eee",
        backgroundColor: "#fff",
    },

    pdfButton: {
        height: 52,
        borderRadius: 14,
        backgroundColor: "#2563eb",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },

    pdfButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
});
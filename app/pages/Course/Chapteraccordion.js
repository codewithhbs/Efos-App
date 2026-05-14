

import React, { useRef, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../utils/dummyData";

// ─── palette ─────────────────────────────────────────────────────────────────
const C = {
    bg: COLORS.bg,
    surface: COLORS.card,
    border: COLORS.border,
    accent: COLORS.primary,
    accentBg: COLORS.primaryLight,
    text: COLORS.text,
    textSec: COLORS.textSecondary,
    textDim: COLORS.textLight,
    success: COLORS.success,
    warning: COLORS.warning,
    gold: COLORS.warning,
    white: COLORS.white,
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmtDuration(sec) {
    if (!sec) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function lessonCount(chapter) {
    const n = chapter.lessons?.length || 0;
    return `${n} lesson${n !== 1 ? "s" : ""}`;
}

function totalDuration(chapter) {
    const secs = (chapter.lessons || []).reduce((a, l) => a + (l.duration_seconds || 0), 0);
    if (!secs) return "";
    const m = Math.floor(secs / 60);
    return `${m} min`;
}

// ─── Lesson Row ───────────────────────────────────────────────────────────────
function LessonRow({ lesson, isActive, onPress }) {
    const isVideo = lesson.type === "video";
    const isLocked = lesson.locked === true;
    const isFree = lesson.is_free_preview === 1;

    const canPlay = isVideo && !isLocked && !!lesson.video_url;

    return (
        <TouchableOpacity
            style={[
                ls.row,
                isActive && ls.rowActive,
                isLocked && ls.rowLocked,
            ]}
            onPress={() => canPlay && onPress(lesson)}
            activeOpacity={canPlay ? 0.7 : 1}
        >
            {/* Left icon */}
            <View style={[
                ls.iconBox,
                isActive && ls.iconBoxActive,
                isLocked && ls.iconBoxLocked,
            ]}>
                {isLocked
                    ? <Ionicons name="lock-closed" size={12} color={C.textDim} />
                    : isActive
                        ? <Ionicons name="pause" size={12} color={C.white} />
                        : isVideo
                            ? <Ionicons name="play" size={12} color={C.accent} />
                            : <Ionicons name="document-text-outline" size={12} color={C.gold} />
                }
            </View>

            {/* Content */}
            <View style={ls.meta}>
                <Text
                    style={[ls.title, isActive && ls.titleActive, isLocked && ls.titleLocked]}
                    numberOfLines={2}
                >
                    {lesson.title}
                </Text>
                <View style={ls.tagRow}>
                    {/* Type badge */}
                    <View style={[ls.badge, isVideo ? ls.badgeVideo : ls.badgeText]}>
                        <Text style={[ls.badgeTxt, isVideo ? ls.badgeTxtVideo : ls.badgeTxtText]}>
                            {isVideo ? "VIDEO" : "TEXT"}
                        </Text>
                    </View>
                    {/* Free badge */}
                    {isFree && (
                        <View style={ls.badgeFree}>
                            <Text style={ls.badgeFreeTxt}>FREE</Text>
                        </View>
                    )}
                    {/* Duration */}
                    {lesson.duration_seconds > 0 && (
                        <View style={ls.durationRow}>
                            <Ionicons name="time-outline" size={9} color={C.textDim} />
                            <Text style={ls.durationTxt}>{fmtDuration(lesson.duration_seconds)}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Right: lock / active dot */}
            {isActive
                ? <View style={ls.activeDot} />
                : isLocked
                    ? <Ionicons name="lock-closed" size={14} color={C.textDim} style={{ marginRight: 2 }} />
                    : null
            }
        </TouchableOpacity>
    );
}

// ─── Single Accordion Item ────────────────────────────────────────────────────
function AccordionItem({ chapter, index, activeLesson, onPressLesson, defaultOpen }) {
    const [open, setOpen] = useState(defaultOpen || false);
    const rotateAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

    const lessons = chapter.lessons || [];
    const hasActivLesson = lessons.some((l) => l.id === activeLesson?.id);

    const toggle = () => {
        const toOpen = !open;
        setOpen(toOpen);
        Animated.timing(rotateAnim, {
            toValue: toOpen ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const chevron = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "180deg"],
    });

    const freeCount = lessons.filter((l) => l.is_free_preview === 1).length;

    return (
        <View style={[as.wrap, hasActivLesson && as.wrapActive]}>
            {/* Header */}
            <TouchableOpacity
                style={[as.header, open && as.headerOpen]}
                onPress={toggle}
                activeOpacity={0.8}
            >
                {/* Chapter number */}
                <View style={[as.numBox, open && as.numBoxOpen]}>
                    <Text style={[as.numTxt, open && as.numTxtOpen]}>{index + 1}</Text>
                </View>

                <View style={as.headerMeta}>
                    <Text style={[as.chapterTitle, open && as.chapterTitleOpen]} numberOfLines={2}>
                        {chapter.title}
                    </Text>
                    <View style={as.headerStats}>
                        <View style={as.statChip}>
                            <Ionicons name="layers-outline" size={10} color={C.textDim} />
                            <Text style={as.statTxt}>{lessonCount(chapter)}</Text>
                        </View>
                        {totalDuration(chapter) ? (
                            <View style={as.statChip}>
                                <Ionicons name="time-outline" size={10} color={C.textDim} />
                                <Text style={as.statTxt}>{totalDuration(chapter)}</Text>
                            </View>
                        ) : null}
                        {freeCount > 0 && (
                            <View style={[as.statChip, as.freeChip]}>
                                <Text style={as.freeChipTxt}>{freeCount} free</Text>
                            </View>
                        )}
                    </View>
                </View>

                <Animated.View style={{ transform: [{ rotate: chevron }] }}>
                    <Ionicons name="chevron-down" size={16} color={open ? C.accent : C.textDim} />
                </Animated.View>
            </TouchableOpacity>

            {/* Lessons list */}
            {open && (
                <View style={as.lessonList}>
                    {lessons.length === 0 ? (
                        <View style={as.emptyRow}>
                            <Ionicons name="hourglass-outline" size={16} color={C.textDim} />
                            <Text style={as.emptyTxt}>Lessons coming soon</Text>
                        </View>
                    ) : (
                        lessons
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((lesson) => (
                                <LessonRow
                                    key={lesson.id}
                                    lesson={lesson}
                                    isActive={activeLesson?.id === lesson.id}
                                    onPress={onPressLesson}
                                />
                            ))
                    )}
                </View>
            )}
        </View>
    );
}

// ─── Exported component ───────────────────────────────────────────────────────
export default function ChapterAccordion({
    chapters = [],
    activeLesson = null,
    onPressLesson = () => {},
    style,
}) {
    if (!chapters.length) {
        return (
            <View style={[as.empty, style]}>
                <Ionicons name="book-outline" size={28} color={C.textDim} />
                <Text style={as.emptyTxt}>No chapters yet</Text>
            </View>
        );
    }

    return (
        <View style={[as.container, style]}>
            {chapters.map((chapter, i) => (
                <AccordionItem
                    key={chapter.id}
                    chapter={chapter}
                    index={i}
                    activeLesson={activeLesson}
                    onPressLesson={onPressLesson}
                    defaultOpen={i === 0}
                />
            ))}
        </View>
    );
}

// ─── Accordion styles ─────────────────────────────────────────────────────────
const as = StyleSheet.create({
    container: {},
    empty: { alignItems: "center", paddingVertical: 32, gap: 8 },
    emptyTxt: { color: C.textDim, fontSize: 13 },

    wrap: {
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        backgroundColor: C.bg,
    },
    wrapActive: {
        borderLeftWidth: 3,
        borderLeftColor: C.accent,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 14,
        gap: 12,
        backgroundColor: C.bg,
    },
    headerOpen: {
        backgroundColor: C.accentBg,
    },
    numBox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    numBoxOpen: {
        backgroundColor: C.accent,
        borderColor: C.accent,
    },
    numTxt: {
        fontSize: 11,
        fontWeight: "800",
        color: C.textSec,
    },
    numTxtOpen: {
        color: C.white,
    },
    headerMeta: { flex: 1 },
    chapterTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: C.text,
        lineHeight: 20,
    },
    chapterTitleOpen: { color: C.accent },
    headerStats: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 4,
        flexWrap: "wrap",
    },
    statChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },
    statTxt: { fontSize: 10, color: C.textDim },
    freeChip: {
        backgroundColor: "#dcfce7",
        borderRadius: 4,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    freeChipTxt: { fontSize: 9, fontWeight: "700", color: C.success },

    lessonList: { backgroundColor: C.surface },
    emptyRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 16,
        paddingLeft: 20,
    },
});

// ─── Lesson styles ────────────────────────────────────────────────────────────
const ls = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        gap: 10,
    },
    rowActive: {
        backgroundColor: "#fff0f0",
    },
    rowLocked: {
        opacity: 0.55,
    },
    iconBox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    iconBoxActive: {
        backgroundColor: C.accent,
        borderColor: C.accent,
    },
    iconBoxLocked: {
        backgroundColor: C.surface,
        borderColor: C.border,
    },
    meta: { flex: 1 },
    title: {
        fontSize: 13,
        fontWeight: "500",
        color: C.textSec,
        lineHeight: 18,
    },
    titleActive: { color: C.accent, fontWeight: "700" },
    titleLocked: { color: C.textDim },
    tagRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginTop: 4,
        flexWrap: "wrap",
    },
    badge: {
        borderRadius: 4,
        paddingVertical: 2,
        paddingHorizontal: 5,
    },
    badgeVideo: { backgroundColor: "#fff0f0" },
    badgeText: { backgroundColor: "#fffbeb" },
    badgeTxt: { fontSize: 8, fontWeight: "800", letterSpacing: 0.4 },
    badgeTxtVideo: { color: C.accent },
    badgeTxtText: { color: C.gold },
    badgeFree: {
        backgroundColor: "#dcfce7",
        borderRadius: 4,
        paddingVertical: 2,
        paddingHorizontal: 5,
    },
    badgeFreeTxt: { fontSize: 8, fontWeight: "800", color: C.success, letterSpacing: 0.4 },
    durationRow: { flexDirection: "row", alignItems: "center", gap: 2 },
    durationTxt: { fontSize: 10, color: C.textDim },
    activeDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: C.accent,
        marginRight: 2,
    },
});
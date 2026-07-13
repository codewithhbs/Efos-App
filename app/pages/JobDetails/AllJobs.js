import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
    useMemo,
    memo,
} from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    Animated,
    StatusBar,
    ActivityIndicator,
    TextInput,
    Dimensions,
    Platform,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import API from "../../utils/axiosInstanct";
import useAuthStore from "../../store/useAuthStore";

const { width: SW } = Dimensions.get("window");

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
    bg: "#f6f6f8",
    card: "#ffffff",
    border: "#ebebef",
    text: "#0d0d0d",
    sub: "#52525b",
    light: "#a1a1aa",
    red: "#e11d48",
    redSoft: "#ffedf0",
    redBorder: "#ffc9cf",
    green: "#16a34a",
    greenSoft: "#f0fdf4",
    white: "#ffffff",
    headerBg: "#ffffff",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const JobSkeleton = memo(() => {
    const fade = useRef(new Animated.Value(0.4)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(fade, { toValue: 1, duration: 750, useNativeDriver: true }),
                Animated.timing(fade, { toValue: 0.4, duration: 750, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    return (
        <Animated.View style={[styles.card, { opacity: fade }]}>
            <View style={styles.skLogo} />
            <View style={{ flex: 1, gap: 8 }}>
                <View style={[styles.skLine, { width: "75%" }]} />
                <View style={[styles.skLine, { width: "50%", height: 10 }]} />
                <View style={[styles.skLine, { width: "90%", height: 10, marginTop: 4 }]} />
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <View style={[styles.skLine, { width: 70, height: 26, borderRadius: 20 }]} />
                    <View style={[styles.skLine, { width: 80, height: 26, borderRadius: 20 }]} />
                </View>
            </View>
        </Animated.View>
    );
});

const SkeletonList = memo(() => (
    <View style={{ paddingHorizontal: 16 }}>
        {[1, 2, 3, 4, 5].map((i) => <JobSkeleton key={i} />)}
    </View>
));

// ─── Category chip ────────────────────────────────────────────────────────────
const Chip = memo(({ label, active, onPress }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const press = () => {
        Animated.sequence([
            Animated.spring(scale, { toValue: 0.91, useNativeDriver: true, speed: 50 }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }),
        ]).start();
        onPress();
    };
    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                onPress={press}
                activeOpacity={0.85}
                style={[styles.chip, active && styles.chipActive]}
            >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
});

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = memo(({ search }) => (
    <View style={styles.emptyWrap}>
        <View style={styles.emptyRing}>
            <Ionicons name="briefcase-outline" size={36} color={T.red} />
        </View>
        <Text style={styles.emptyTitle}>No jobs found</Text>
        <Text style={styles.emptySub}>
            {search ? `No results for "${search}"` : "Check back soon for new opportunities"}
        </Text>
    </View>
));

// ─── Footer loader ────────────────────────────────────────────────────────────
const FooterLoader = memo(() => (
    <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={T.red} />
        <Text style={styles.footerText}>Loading more…</Text>
    </View>
));

// ─── Job Card ─────────────────────────────────────────────────────────────────
const JobCard = memo(({ item, onPress, onBookmark, bookmarked }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const onIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
    const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

    const bkScale = useRef(new Animated.Value(1)).current;
    const onBk = () => {
        onBookmark(item.slug);
        Animated.sequence([
            Animated.spring(bkScale, { toValue: 1.4, useNativeDriver: true, speed: 40 }),
            Animated.spring(bkScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
        ]).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={onIn}
                onPressOut={onOut}
                onPress={onPress}
                style={styles.card}
            >
                {/* Top row: logo + title + bookmark */}
                <View style={styles.cardTop}>
                    <Image
                        source={{ uri: item.company_logo }}
                        style={styles.logo}
                        defaultSource={{ uri: "https://via.placeholder.com/54" }}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text numberOfLines={1} style={styles.jobTitle}>{item.title}</Text>
                        <Text numberOfLines={1} style={styles.company}>{item.company_name}</Text>
                    </View>
                    <TouchableOpacity onPress={onBk} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Animated.View style={{ transform: [{ scale: bkScale }] }}>
                            <Ionicons
                                name={bookmarked ? "bookmark" : "bookmark-outline"}
                                size={20}
                                color={bookmarked ? T.red : T.light}
                            />
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                {/* Description */}
                {!!item.short_description && (
                    <Text numberOfLines={2} style={styles.desc}>{item.short_description}</Text>
                )}

                {/* Meta chips */}
                <View style={styles.metaRow}>
                    {!!item.salary && (
                        <View style={styles.metaChip}>
                            <Ionicons name="cash-outline" size={11} color={T.red} />
                            <Text style={styles.metaText}>{item.salary}</Text>
                        </View>
                    )}
                    {!!item.work_mode && (
                        <View style={styles.metaChip}>
                            <Ionicons name="briefcase-outline" size={11} color={T.red} />
                            <Text style={styles.metaText}>{item.work_mode}</Text>
                        </View>
                    )}
                    {!!item.education && (
                        <View style={styles.metaChip}>
                            <Ionicons name="school-outline" size={11} color={T.red} />
                            <Text style={styles.metaText}>{item.education}</Text>
                        </View>
                    )}
                </View>

                {/* Bottom: time + CTA */}
                <View style={styles.cardBottom}>
                    <View style={styles.timeRow}>
                        <Ionicons name="time-outline" size={12} color={T.light} />
                        <Text style={styles.timeText}>{timeAgo(item.created_at || item.createdAt)}</Text>
                    </View>

                    {item.is_applied ? (
                        <View style={styles.appliedBtn}>
                            <Ionicons name="checkmark-circle" size={13} color={T.green} />
                            <Text style={styles.appliedText}>Applied</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.applyBtn} activeOpacity={0.85} onPress={onPress}>
                            <Text style={styles.applyText}>Apply Now</Text>
                            <Ionicons name="arrow-forward" size={12} color={T.white} />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AllJobs({ navigation, route }) {
    const { user } = useAuthStore();
    const { categorySlug, id } = route.params || {}
    const [jobs, setJobs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [activeChip, setActiveChip] = useState("all");
    const [bookmarks, setBookmarks] = useState(new Set());

    const scrollY = useRef(new Animated.Value(0)).current;
    const headerElev = scrollY.interpolate({ inputRange: [0, 40], outputRange: [0, 6], extrapolate: "clamp" });

    useEffect(() => {
        if (categorySlug) {
            setActiveChip(categorySlug)
        }
    }, [categorySlug])
    // Fetch categories
    useEffect(() => {
        const fetchCats = async () => {
            try {

                const res = await API.get("/job/category");
                const cats = res.data?.data || [];
                setCategories(cats);
            } catch (e) {
                console.log("Category fetch error:", e);
            }
        };
        fetchCats();
    }, []);

    const activeCategoryId = useMemo(() => {
        if (activeChip === "all") return null;
        const cat = categories.find((c) => c.slug === activeChip);
        return cat?.id ?? (categorySlug === activeChip ? id : null); // fallback: params se aayi id
    }, [activeChip, categories, categorySlug, id]);
    // Fetch jobs
    const fetchJobs = useCallback(async (pageNo = 1, more = false, refresh = false) => {
        try {
            if (more) setLoadingMore(true);
            else if (refresh) setRefreshing(true);
            else setLoading(true);

            let url = `/job/get?page=${pageNo}&limit=10`;
            if (activeChip !== "all" && activeCategoryId) {
                url += `&category=${activeCategoryId}`;
            }

            const res = await API.get(url);
            const list = res.data?.data || [];

            if (more) setJobs((prev) => [...prev, ...list]);
            else setJobs(list);

            setHasMore(list.length >= 10);
            setPage(pageNo);
        } catch (err) {
            console.log("Jobs fetch error:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [activeChip, activeCategoryId]);

    useEffect(() => { fetchJobs(1); }, [activeChip]);

    const loadMore = useCallback(() => {
        if (!loadingMore && !loading && hasMore) fetchJobs(page + 1, true);
    }, [loadingMore, loading, hasMore, page, fetchJobs]);

    const onRefresh = useCallback(() => fetchJobs(1, false, true), [fetchJobs]);

    const toggleBookmark = useCallback((slug) => {
        setBookmarks((prev) => {
            const next = new Set(prev);
            next.has(slug) ? next.delete(slug) : next.add(slug);
            return next;
        });
    }, []);

    // Client-side search filter (on top of server category filter)
    const filtered = useMemo(() => {
        if (!search.trim()) return jobs;
        const q = search.toLowerCase();
        return jobs.filter(
            (j) =>
                j.title?.toLowerCase().includes(q) ||
                j.company_name?.toLowerCase().includes(q) ||
                (j.short_description || "").toLowerCase().includes(q)
        );
    }, [jobs, search]);

    const renderJob = useCallback(({ item }) => (
        <JobCard
            item={item}
            onPress={() => navigation?.navigate("JobDetail", { slug: item.slug })}
            onBookmark={toggleBookmark}
            bookmarked={bookmarks.has(item.slug)}
        />
    ), [toggleBookmark, bookmarks, navigation]);

    const keyExtractor = useCallback((item, i) => `${item.slug}-${i}`, []);

    // All-chip + dynamic categories
    const allChips = useMemo(
        () => [{ id: "all", label: "All" }, ...categories.map((c) => ({ id: c.slug, label: c.name }))],
        [categories]
    );

    const ListHeader = (
        <View>
            {/* Search */}
            <View style={styles.searchWrap}>
                <Ionicons name="search-outline" size={18} color={T.light} style={{ marginRight: 10 }} />
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search jobs, companies…"
                    placeholderTextColor={T.light}
                    style={styles.searchInput}
                    returnKeyType="search"
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close-circle" size={18} color={T.light} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Category chips */}
            <FlatList
                data={allChips}
                horizontal
                keyExtractor={(c) => c.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsWrap}
                renderItem={({ item }) => (
                    <Chip
                        label={item.label}
                        active={activeChip === item.id}
                        onPress={() => setActiveChip(item.id)}
                    />
                )}
            />

            {/* Count */}
            <View style={styles.countRow}>
                <Text style={styles.countText}>
                    {filtered.length} job{filtered.length !== 1 ? "s" : ""}
                    {activeChip !== "all" && (
                        <Text style={{ color: T.red }}>
                            {" · "}{allChips.find((c) => c.id === activeChip)?.label}
                        </Text>
                    )}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.root} edges={["top"]}>
            <StatusBar barStyle="dark-content" backgroundColor={T.white} />

            {/* Sticky header */}
            <Animated.View style={[styles.header, { elevation: headerElev }]}>
                <View style={styles.headerInner}>
                    <View style={{ flex: 1 }}>
                        {/* <Text style={styles.eyebrow}>OPPORTUNITIES</Text> */}
                        <Text style={styles.headTitle}>Latest Opportunities</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate("Notifications")} style={styles.notifBtn}>
                        <Ionicons name="notifications-outline" size={22} color={T.text} />
                        <View style={styles.notifDot} />
                    </TouchableOpacity>

                </View>
            </Animated.View>

            {/* Content */}
            {loading ? (
                <View style={{ flex: 1 }}>
                    {ListHeader}
                    <SkeletonList />
                </View>
            ) : (
                <Animated.FlatList
                    data={filtered}
                    keyExtractor={keyExtractor}
                    renderItem={renderJob}
                    ListHeaderComponent={ListHeader}
                    ListEmptyComponent={<EmptyState search={search} />}
                    ListFooterComponent={loadingMore ? <FooterLoader /> : <View style={{ height: 40 }} />}
                    contentContainerStyle={styles.flatContent}
                    showsVerticalScrollIndicator={false}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.35}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={T.red}
                            colors={[T.red]}
                        />
                    }
                    removeClippedSubviews={Platform.OS === "android"}
                    maxToRenderPerBatch={8}
                    windowSize={12}
                    initialNumToRender={5}
                />
            )}
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },

    // Header
    header: {
        backgroundColor: T.white,
        borderBottomWidth: 1,
        borderBottomColor: T.border,
        zIndex: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },
    headerInner: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
    },
    eyebrow: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 2.5,
        color: T.red,
        marginBottom: 2,
    },
    headTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: T.text,
        letterSpacing: -0.4,
    },
    notifBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: "#f4f4f6",
        alignItems: "center", justifyContent: "center",
    },
    notifDot: {
        position: "absolute", top: 9, right: 9,
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: T.red, borderWidth: 1.5, borderColor: T.white,
    },
    avatarCircle: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: T.red,
        alignItems: "center", justifyContent: "center",
    },

    // Search
    searchWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: T.white,
        borderRadius: 14,

        marginTop: 14,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === "ios" ? 13 : 11,

    },
    searchInput: { flex: 1, fontSize: 14, color: T.text, fontWeight: "500" },

    // Chips
    chipsWrap: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    chip: {
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 24, marginRight: 8,
        backgroundColor: "#f0f0f5",
        borderWidth: 1.5, borderColor: "#e0e0ea",
    },
    chipActive: { backgroundColor: T.red, borderColor: T.red },
    chipText: { fontSize: 13, fontWeight: "700", color: T.sub },
    chipTextActive: { color: T.white },

    // Count row
    countRow: {
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    countText: { fontSize: 13, color: T.light, fontWeight: "600" },

    // Card
    card: {
        backgroundColor: T.white,
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,

    },
    cardTop: { flexDirection: "row", alignItems: "flex-start" },
    logo: {
        width: 52, height: 52, borderRadius: 14,
        backgroundColor: "#f4f4f6",
        borderWidth: 1, borderColor: T.border,
    },
    jobTitle: {
        fontSize: 15, fontWeight: "800",
        color: T.text, lineHeight: 20,
    },
    company: { fontSize: 13, color: T.sub, marginTop: 2 },

    desc: {
        fontSize: 12, color: T.light,
        marginTop: 10, lineHeight: 18,
    },

    metaRow: {
        flexDirection: "row", flexWrap: "wrap",
        gap: 8, marginTop: 12,
    },
    metaChip: {
        flexDirection: "row", alignItems: "center", gap: 5,
        backgroundColor: "#ffedf0",
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1, borderColor: T.redBorder,
    },
    metaText: { fontSize: 11, color: T.text, fontWeight: "700" },

    cardBottom: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 14,
    },
    timeRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    timeText: { fontSize: 11, color: T.light, fontWeight: "500" },

    applyBtn: {
        flexDirection: "row", alignItems: "center", gap: 6,
        backgroundColor: T.red,
        paddingHorizontal: 16, paddingVertical: 9,
        borderRadius: 12,
    },
    applyText: { color: T.white, fontSize: 12, fontWeight: "800" },

    appliedBtn: {
        flexDirection: "row", alignItems: "center", gap: 6,
        backgroundColor: "#f0fdf4",
        paddingHorizontal: 14, paddingVertical: 9,
        borderRadius: 12,
        borderWidth: 1, borderColor: "rgba(22,163,74,0.25)",
    },
    appliedText: { color: T.green, fontSize: 12, fontWeight: "800" },

    // Skeleton
    skLogo: {
        width: 52, height: 52, borderRadius: 14,
        backgroundColor: "#e8e8ee", marginRight: 14, flexShrink: 0,
    },
    skLine: { height: 13, backgroundColor: "#e8e8ee", borderRadius: 8, width: "90%" },

    // Empty
    emptyWrap: { alignItems: "center", justifyContent: "center", paddingTop: 64, paddingHorizontal: 32 },
    emptyRing: {
        width: 84, height: 84, borderRadius: 42,
        backgroundColor: "#ffedf0",
        alignItems: "center", justifyContent: "center",
        marginBottom: 18,
        borderWidth: 1.5, borderColor: T.redBorder,
    },
    emptyTitle: { fontSize: 20, fontWeight: "800", color: T.text, marginBottom: 8 },
    emptySub: { fontSize: 14, color: T.light, textAlign: "center", lineHeight: 21 },

    // Footer loader
    footerLoader: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "center", gap: 10, paddingVertical: 20,
    },
    footerText: { fontSize: 13, color: T.light, fontWeight: "600" },

    flatContent: { paddingHorizontal: 16, paddingBottom: 60 },
});

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    View,
    Text,
    StatusBar,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    ScrollView,
    Animated,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../utils/dummyData";
import useAuthStore from "../../store/useAuthStore";
import { Loader, AuthWarn } from "../../components/LoadingAndAuthWarn";
import API from "../../utils/axiosInstanct";

const { width } = Dimensions.get("window");

const FILTERS = ["All", "Success", "Pending", "Failed"];

const PAYMENT_CONFIG = {
    success: { label: "Active", color: "#10B981", bg: "#ECFDF5", icon: "checkmark-circle" },
    pending: { label: "Pending", color: "#F59E0B", bg: "#FFFBEB", icon: "time" },
    failed: { label: "Failed", color: "#EF4444", bg: "#FEF2F2", icon: "close-circle" },
};

const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatPrice = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? "₹0" : `₹${n.toFixed(2)}`;
};

// ── Card ──────────────────────────────────────────────────────
function CourseCard({ item, onPress, index }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(18)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 320, delay: index * 60, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 320, delay: index * 60, useNativeDriver: true }),
        ]).start();
    }, []);

    const cfg = PAYMENT_CONFIG[item.payment_status?.toLowerCase()] || PAYMENT_CONFIG.pending;
    const saved = parseFloat(item.discount_amount || 0);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            <TouchableOpacity activeOpacity={0.88} style={styles.card} onPress={onPress}>
                {/* Thumbnail */}
                <View style={styles.imgWrap}>
                    <Image
                        source={{ uri: item.thumbnail }}
                        style={styles.cardImg}
                        resizeMode="cover"
                    />
                    {/* Payment badge overlay */}
                    <View style={[styles.badgeOverlay, { backgroundColor: cfg.bg }]}>
                        <Ionicons name={cfg.icon} size={11} color={cfg.color} />
                        <Text style={[styles.badgeOverlayText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                </View>

                {/* Body */}
                <View style={styles.cardBody}>
                    <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>

                    {/* Price row */}
                    <View style={styles.priceRow}>
                        <View style={styles.priceChip}>
                            <Ionicons name="pricetag-outline" size={11} color={COLORS.primary} />
                            <Text style={styles.priceText}>{formatPrice(item.amount)}</Text>
                        </View>
                        {saved > 0 && (
                            <View style={styles.savedChip}>
                                <Text style={styles.savedText}>Saved {formatPrice(item.discount_amount)}</Text>
                            </View>
                        )}
                        {item.coupon_code && (
                            <View style={styles.couponChip}>
                                <Ionicons name="ticket-outline" size={10} color="#8B5CF6" />
                                <Text style={styles.couponText}>{item.coupon_code}</Text>
                            </View>
                        )}
                    </View>

                    {/* Date */}
                    <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                        <Text style={styles.dateText}>Enrolled {formatDate(item.purchased_at)}</Text>
                    </View>

                    {/* CTA */}
                    <TouchableOpacity style={styles.ctaBtn} onPress={onPress} activeOpacity={0.82}>
                        <Text style={styles.ctaBtnText}>Continue Learning</Text>
                        <Ionicons name="arrow-forward" size={14} color="#fff" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Main Screen ───────────────────────────────────────────────
export default function MyCourseEnrolled({ navigation }) {
    const { user } = useAuthStore();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const searchTimer = useRef(null);

    const fetchCourses = async ({ pg = 1, q = search, filter = activeFilter, replace = false } = {}) => {
        try {
            if (pg === 1 && !replace) setLoading(true);
            else if (pg > 1) setLoadingMore(true);

            const params = { page: pg, limit: 10, search: q };
            if (filter !== "All") params.payment_status = filter.toLowerCase();

            const res = await API.get("/auth/enrolled-courses", { params });
            const data = res.data?.data || [];

            setCourses((prev) => (pg === 1 ? data : [...prev, ...data]));
            setTotalPages(res.data?.totalPages || 1);
            setTotal(res.data?.total || 0);
            setPage(pg);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => { fetchCourses({ pg: 1, replace: true }); }, []);

    // debounce search
    const handleSearch = (val) => {
        setSearch(val);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            fetchCourses({ pg: 1, q: val, replace: true });
        }, 400);
    };

    const handleFilter = (f) => {
        setActiveFilter(f);
        fetchCourses({ pg: 1, filter: f, replace: true });
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchCourses({ pg: 1, replace: true });
    };

    const onEndReached = () => {
        if (!loadingMore && page < totalPages) {
            fetchCourses({ pg: page + 1 });
        }
    };

    // Stats
    const successCount = courses.filter(c => c.payment_status === "success").length;
    const pendingCount = courses.filter(c => c.payment_status === "pending").length;

    if (!user) return <AuthWarn />;
    if (loading) return <Loader />;

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <StatusBar barStyle="dark-content" />

            <FlatList
                data={courses}
                keyExtractor={(item) => String(item.buy_id)}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.4}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}

                ListHeaderComponent={
                    <View>
                        {/* ── Gradient Header ── */}
                        <LinearGradient
                            colors={[COLORS.primary, "#f65c6b"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.header}
                        >
                            <View style={styles.headerInner}>
                                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                                    <Ionicons name="arrow-back" size={20} color="#fff" />
                                </TouchableOpacity>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.headerTitle}>My Courses</Text>
                                    <Text style={styles.headerSub}>Continue your learning journey 🚀</Text>
                                </View>
                                <View style={styles.totalBadge}>
                                    <Text style={styles.totalBadgeText}>{total}</Text>
                                </View>
                            </View>

                            {/* Stats row inside header */}
                            <View style={styles.statsRow}>
                                {[
                                    { label: "Total", value: total, icon: "library-outline", color: "#fff" },
                                    { label: "Active", value: successCount, icon: "play-circle-outline", color: "#A7F3D0" },
                                    { label: "Pending", value: pendingCount, icon: "time-outline", color: "#FDE68A" },
                                ].map((s) => (
                                    <View key={s.label} style={styles.statCard}>
                                        <Ionicons name={s.icon} size={18} color={s.color} />
                                        <Text style={styles.statVal}>{s.value}</Text>
                                        <Text style={styles.statLbl}>{s.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </LinearGradient>

                        {/* ── Search ── */}
                        <View style={styles.searchWrap}>
                            <Ionicons name="search-outline" size={16} color="#9CA3AF" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search courses…"
                                placeholderTextColor="#B0B8C4"
                                value={search}
                                onChangeText={handleSearch}
                                returnKeyType="search"
                            />
                            {search.length > 0 && (
                                <TouchableOpacity onPress={() => handleSearch("")}>
                                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* ── Filter Chips ── */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterRow}
                        >
                            {FILTERS.map((f) => {
                                const active = activeFilter === f;
                                return (
                                    <TouchableOpacity
                                        key={f}
                                        style={[styles.chip, active && styles.chipActive]}
                                        onPress={() => handleFilter(f)}
                                        activeOpacity={0.75}
                                    >
                                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Result count */}
                        {!loading && (
                            <Text style={styles.resultCount}>
                                {courses.length} course{courses.length !== 1 ? "s" : ""} found
                            </Text>
                        )}
                    </View>
                }

                ListEmptyComponent={
                    <View style={styles.emptyWrap}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="book-outline" size={40} color="#C7D2FE" />
                        </View>
                        <Text style={styles.emptyTitle}>No Courses Found</Text>
                        <Text style={styles.emptySub}>
                            {search ? "Try a different search" : "Enrolled courses will appear here"}
                        </Text>
                    </View>
                }

                ListFooterComponent={
                    loadingMore ? (
                        <View style={styles.footerLoader}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                            <Text style={styles.footerLoaderText}>Loading more…</Text>
                        </View>
                    ) : null
                }

                renderItem={({ item, index }) => (
                    <CourseCard
                        item={item}
                        index={index}
                        onPress={() => navigation.navigate("Classroom", { courseId: item.course_id })}
                    />
                )}
            />
        </SafeAreaView>
    );
}

// ─────────────────────────── STYLES ───────────────────────────
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F5F6FA" },
    listContent: { paddingBottom: 40 },

    // Header
    header: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 20,
    },
    headerInner: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
    backBtn: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.18)",
        justifyContent: "center", alignItems: "center",
    },
    headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
    headerSub: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 },
    totalBadge: {
        backgroundColor: "rgba(255,255,255,0.22)",
        borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    },
    totalBadgeText: { color: "#fff", fontWeight: "700", fontSize: 13 },

    // Stats inside header
    statsRow: {
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.12)",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 8,
        gap: 4,
    },
    statCard: { flex: 1, alignItems: "center", gap: 3 },
    statVal: { fontSize: 16, fontWeight: "800", color: "#fff" },
    statLbl: { fontSize: 10, color: "rgba(255,255,255,0.72)", fontWeight: "500" },

    // Search
    searchWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        marginHorizontal: 14,
        marginTop: 14,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: "#EBEBF0",
    },
    searchInput: { flex: 1, fontSize: 13, color: "#111", padding: 0 },

    // Filters
    filterRow: { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 20, borderWidth: 1,
        borderColor: "#E5E7EB", backgroundColor: "#fff",
    },
    chipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
    chipTextActive: { color: "#fff" },

    resultCount: {
        fontSize: 11, color: "#9CA3AF", fontWeight: "500",
        marginLeft: 16, marginBottom: 4,
    },

    // Card
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        marginHorizontal: 14,
        marginBottom: 14,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#EBEBF0",
    },
    imgWrap: { position: "relative" },
    cardImg: { width: "100%", height: 170, backgroundColor: "#EEF2FF" },
    badgeOverlay: {
        position: "absolute", top: 10, right: 10,
        flexDirection: "row", alignItems: "center", gap: 4,
        paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 20,
    },
    badgeOverlayText: { fontSize: 10, fontWeight: "700" },

    cardBody: { padding: 13 },
    cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827", lineHeight: 21 },

    priceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" },
    priceChip: {
        flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: "#EEF2FF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    priceText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },
    savedChip: {
        backgroundColor: "#ECFDF5", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    savedText: { fontSize: 10, fontWeight: "600", color: "#10B981" },
    couponChip: {
        flexDirection: "row", alignItems: "center", gap: 3,
        backgroundColor: "#F5F3FF", paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8,
    },
    couponText: { fontSize: 10, fontWeight: "600", color: "#8B5CF6" },

    dateRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
    dateText: { fontSize: 11, color: "#9CA3AF" },

    ctaBtn: {
        marginTop: 12,
        backgroundColor: COLORS.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 11,
        borderRadius: 10,
    },
    ctaBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

    // Empty
    emptyWrap: { alignItems: "center", marginTop: 70, paddingHorizontal: 32 },
    emptyIconBox: {
        width: 80, height: 80, borderRadius: 20,
        backgroundColor: "#EEF2FF",
        justifyContent: "center", alignItems: "center", marginBottom: 14,
    },
    emptyTitle: { fontSize: 17, fontWeight: "700", color: "#374151", marginBottom: 6 },
    emptySub: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },

    // Footer loader
    footerLoader: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
    footerLoaderText: { fontSize: 12, color: "#9CA3AF" },
});

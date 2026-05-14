import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    View, Text, StatusBar, FlatList, TouchableOpacity,
    StyleSheet, Image, RefreshControl, ActivityIndicator,
    TextInput, ScrollView, Animated, Linking, Alert,
    Clipboard, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../utils/dummyData";
import useAuthStore from "../../store/useAuthStore";
import { Loader, AuthWarn } from "../../components/LoadingAndAuthWarn";
import API from "../../utils/axiosInstanct";

const { width } = Dimensions.get("window");

// ── Constants ─────────────────────────────────────────────────
const STATUS_FILTERS = ["All", "Pending", "Accepted", "Completed", "Cancelled"];
const PAYMENT_FILTERS = ["All", "Paid", "Pending", "Failed"];

const STATUS_CFG = {
    accepted: { label: "Accepted", color: "#10B981", bg: "#ECFDF5", icon: "checkmark-circle" },
    pending: { label: "Pending", color: "#F59E0B", bg: "#FFFBEB", icon: "time" },
    completed: { label: "Completed", color: "#6C63FF", bg: "#EEF2FF", icon: "ribbon" },
    cancelled: { label: "Cancelled", color: "#EF4444", bg: "#FEF2F2", icon: "close-circle" },
};

const PAYMENT_CFG = {
    success: { label: "Paid", color: "#10B981", bg: "#ECFDF5" },
    pending: { label: "Pending", color: "#F59E0B", bg: "#FFFBEB" },
    failed: { label: "Failed", color: "#EF4444", bg: "#FEF2F2" },
};

const PLATFORM_CFG = {
    zoom: { label: "Zoom", color: "#2D8CFF", icon: "videocam" },
    "google meet": { label: "Google Meet", color: "#34A853", icon: "videocam" },
    teams: { label: "Teams", color: "#5558AF", icon: "videocam" },
};

const SESSION_TYPE_CFG = {
    video: { icon: "videocam-outline", color: "#6C63FF" },
    chat: { icon: "chatbubble-outline", color: "#10B981" },
    call: { icon: "call-outline", color: "#F59E0B" },
};

// ── Helpers ───────────────────────────────────────────────────
const fmt = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtTime = (t) => {
    if (!t) return "—";
    const [h, m] = t.split(":");
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
};

const fmtPrice = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? "₹0" : `₹${n.toLocaleString("en-IN")}`;
};

const getCountdown = (sessionDate, startTime) => {
    if (!sessionDate || !startTime) return null;
    const dateStr = new Date(sessionDate).toISOString().split("T")[0];
    const target = new Date(`${dateStr}T${startTime}`);
    const diff = target - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / 86400000);
    const hrs = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days}d ${hrs}h`;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
};

const canJoin = (sessionDate, startTime) => {
    if (!sessionDate || !startTime) return false;
    const dateStr = new Date(sessionDate).toISOString().split("T")[0];
    const target = new Date(`${dateStr}T${startTime}`);
    return Date.now() >= target - 10 * 60 * 1000;
};

// ── Session Card ──────────────────────────────────────────────
function SessionCard({ item, index, navigation }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 340, delay: index * 70, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 340, delay: index * 70, useNativeDriver: true }),
        ]).start();
    }, []);

    // Tick for countdown / join unlock
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(timer);
    }, []);

    const sCfg = STATUS_CFG[item.status] || STATUS_CFG.pending;
    const pCfg = PAYMENT_CFG[item.payment_status] || PAYMENT_CFG.pending;
    const plCfg = PLATFORM_CFG[item.meeting_platform?.toLowerCase()] || { label: item.meeting_platform, color: "#6B7280", icon: "videocam" };
    const tyCfg = SESSION_TYPE_CFG[item.session_type] || SESSION_TYPE_CFG.video;

    const countdown = getCountdown(item.session_date, item.start_time);
    const joinReady = canJoin(item.session_date, item.start_time);
    const saved = parseFloat(item.price || 0) - parseFloat(item.final_price || 0);

    const handleJoin = () => {
        if (!item.zoom_join_url) return Alert.alert("Link not available", "Meeting link will be shared once accepted.");
        Linking.openURL(item.zoom_join_url);
    };

    const handleCopyLink = () => {
        if (!item.zoom_join_url) return;
        Clipboard.setString(item.zoom_join_url);
        Alert.alert("Copied!", "Meeting link copied to clipboard.");
    };

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.card}>

                {/* ── Card Header: Mentor ── */}
                <View style={styles.cardHeader}>
                    <Image
                        source={{ uri: item.mentor_photo || "https://i.pravatar.cc/150?img=5" }}
                        style={styles.mentorPhoto}
                    />
                    <View style={styles.mentorInfo}>
                        <Text style={styles.mentorName} numberOfLines={1}>{item.mentor_name}</Text>
                        <View style={styles.metaChips}>
                            <View style={[styles.miniChip, { backgroundColor: tyCfg.color + "15" }]}>
                                <Ionicons name={tyCfg.icon} size={10} color={tyCfg.color} />
                                <Text style={[styles.miniChipText, { color: tyCfg.color }]}>{item.session_type}</Text>
                            </View>
                            <View style={[styles.miniChip, { backgroundColor: plCfg.color + "15" }]}>
                                <Ionicons name={plCfg.icon} size={10} color={plCfg.color} />
                                <Text style={[styles.miniChipText, { color: plCfg.color }]}>{plCfg.label}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Status badge */}
                    <View style={[styles.statusBadge, { backgroundColor: sCfg.bg }]}>
                        <Ionicons name={sCfg.icon} size={10} color={sCfg.color} />
                        <Text style={[styles.statusBadgeText, { color: sCfg.color }]}>{sCfg.label}</Text>
                    </View>
                </View>

                {/* ── Divider ── */}
                <View style={styles.cardDivider} />

                {/* ── Session Date & Time ── */}
                <View style={styles.dateTimeRow}>
                    <View style={styles.dtBlock}>
                        <Ionicons name="calendar-outline" size={13} color="#6C63FF" />
                        <Text style={styles.dtLabel}>Date</Text>
                        <Text style={styles.dtValue}>{fmt(item.session_date)}</Text>
                    </View>
                    <View style={styles.dtSep} />
                    <View style={styles.dtBlock}>
                        <Ionicons name="time-outline" size={13} color="#10B981" />
                        <Text style={styles.dtLabel}>Time</Text>
                        <Text style={styles.dtValue}>{fmtTime(item.start_time)} – {fmtTime(item.end_time)}</Text>
                    </View>
                    <View style={styles.dtSep} />
                    <View style={styles.dtBlock}>
                        <Ionicons name="hourglass-outline" size={13} color="#F59E0B" />
                        <Text style={styles.dtLabel}>Duration</Text>
                        <Text style={styles.dtValue}>{item.duration_minutes} min</Text>
                    </View>
                </View>

                {/* ── Countdown ── */}
                {countdown && item.status === "accepted" && (
                    <View style={styles.countdownBar}>
                        <Ionicons name="alarm-outline" size={13} color="#6C63FF" />
                        <Text style={styles.countdownText}>Starts in <Text style={styles.countdownBold}>{countdown}</Text></Text>
                    </View>
                )}

                {/* ── Price + Payment ── */}
                <View style={styles.priceRow}>
                    <View style={styles.priceLeft}>
                        <Text style={styles.priceValue}>{fmtPrice(item.final_price)}</Text>
                        {saved > 0 && <Text style={styles.priceSaved}>Saved {fmtPrice(saved)}</Text>}
                    </View>
                    <View style={[styles.payBadge, { backgroundColor: pCfg.bg }]}>
                        <Text style={[styles.payBadgeText, { color: pCfg.color }]}>{pCfg.label}</Text>
                    </View>
                </View>

                {/* ── Booking ID ── */}
                <View style={styles.bookingRow}>
                    <Ionicons name="receipt-outline" size={11} color="#9CA3AF" />
                    <Text style={styles.bookingId} numberOfLines={1}>ID: {item.transaction_id}</Text>

                </View>

                {/* ── Actions ── */}
                <View style={styles.actionsRow}>
                    {item.status === "accepted" && (
                        <>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.joinBtn, !joinReady && styles.joinBtnDisabled]}
                                onPress={handleJoin}
                                disabled={!joinReady}
                                activeOpacity={0.82}
                            >
                                <Ionicons name="videocam" size={14} color="#fff" />
                                <Text style={styles.joinBtnText}>{joinReady ? "Join Now" : "Join Meeting"}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.iconActionBtn} onPress={handleCopyLink}>
                                <Ionicons name="copy-outline" size={15} color={COLORS.primary} />
                            </TouchableOpacity>

                        </>
                    )}

                    {item.status === "pending" && (
                        <View style={styles.waitingBadge}>
                            <ActivityIndicator size="small" color="#F59E0B" style={{ marginRight: 6 }} />
                            <Text style={styles.waitingText}>Awaiting Mentor Approval</Text>
                        </View>
                    )}

                    {item.status === "completed" && (
                        <TouchableOpacity style={[styles.actionBtn, styles.summaryBtn]} activeOpacity={0.82}>
                            <Ionicons name="document-text-outline" size={14} color={COLORS.primary} />
                            <Text style={styles.summaryBtnText}>View Summary</Text>
                        </TouchableOpacity>
                    )}

                    {item.status === "cancelled" && (
                        <TouchableOpacity style={[styles.actionBtn, styles.rebookBtn]} activeOpacity={0.82}>
                            <Ionicons name="refresh-outline" size={14} color="#fff" />
                            <Text style={styles.joinBtnText}>Rebook</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Animated.View>
    );
}

// ── Main Screen ───────────────────────────────────────────────
export default function BookedSessions({ navigation }) {
    const { user } = useAuthStore();

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [paymentFilter, setPaymentFilter] = useState("All");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const searchTimer = useRef(null);
    const scrollY = useRef(new Animated.Value(0)).current;

    const fetchSessions = async ({ pg = 1, q = search, sf = statusFilter, pf = paymentFilter, replace = false } = {}) => {
        try {
            if (pg === 1) replace ? setLoading(true) : null;
            else setLoadingMore(true);

            const params = { page: pg, limit: 10, search: q };
            if (sf !== "All") params.status = sf.toLowerCase();
            if (pf === "Paid") params.payment_status = "success";
            else if (pf === "Pending") params.payment_status = "pending";
            else if (pf === "Failed") params.payment_status = "failed";

            const res = await API.get("/auth/my-mentor-sessions", { params });
            const data = res.data?.data || [];

            setSessions((prev) => (pg === 1 ? data : [...prev, ...data]));
            setTotalPages(res.data?.totalPages || 1);
            setTotal(res.data?.total || 0);
            setPage(pg);
        } catch (e) {
            console.log("Sessions Error =>", e?.response?.data || e);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => { fetchSessions({ pg: 1, replace: true }); }, []);

    const handleSearch = (val) => {
        setSearch(val);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchSessions({ pg: 1, q: val, replace: true }), 420);
    };

    const handleStatusFilter = (f) => {
        setStatusFilter(f);
        fetchSessions({ pg: 1, sf: f, replace: true });
    };

    const handlePaymentFilter = (f) => {
        setPaymentFilter(f);
        fetchSessions({ pg: 1, pf: f, replace: true });
    };

    const onRefresh = () => { setRefreshing(true); fetchSessions({ pg: 1, replace: true }); };

    const onEndReached = () => {
        if (!loadingMore && page < totalPages) fetchSessions({ pg: page + 1 });
    };

    // Quick stats
    const accepted = sessions.filter(s => s.status === "accepted").length;
    const pending = sessions.filter(s => s.status === "pending").length;
    const completed = sessions.filter(s => s.status === "completed").length;

    if (!user) return <AuthWarn />;
    if (loading) return <Loader />;

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <StatusBar barStyle={"dark-content"} />

            <FlatList
                data={sessions}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.4}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }

                ListHeaderComponent={
                    <View>
                        {/* ── Gradient Header ── */}
                        <LinearGradient
                            colors={["#f43535", "#f65c5c"]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.header}
                        >
                            <View style={styles.headerTop}>
                                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                                    <Ionicons name="arrow-back" size={20} color="#fff" />
                                </TouchableOpacity>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.headerTitle}>My Sessions</Text>
                                    <Text style={styles.headerSub}>Manage your booked mentor sessions</Text>
                                </View>
                                <View style={styles.totalPill}>
                                    <Text style={styles.totalPillText}>{total}</Text>
                                </View>
                            </View>

                            {/* Stats */}
                            <View style={styles.statsRow}>
                                {[
                                    { label: "Total", value: total, icon: "layers-outline", color: "#fff" },
                                    { label: "Active", value: accepted, icon: "checkmark-circle-outline", color: "#A7F3D0" },
                                    { label: "Pending", value: pending, icon: "time-outline", color: "#FDE68A" },
                                    { label: "Done", value: completed, icon: "ribbon-outline", color: "#C4B5FD" },
                                ].map((s) => (
                                    <View key={s.label} style={styles.statCard}>
                                        <Ionicons name={s.icon} size={16} color={s.color} />
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
                                placeholder="Search mentor, booking ID…"
                                placeholderTextColor="#B0B8C4"
                                value={search}
                                onChangeText={handleSearch}
                            />
                            {search.length > 0 && (
                                <TouchableOpacity onPress={() => handleSearch("")}>
                                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* ── Status Filters ── */}
                        <View style={styles.filterSection}>
                            <Text style={styles.filterLabel}>Status</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                                {STATUS_FILTERS.map((f) => {
                                    const active = statusFilter === f;
                                    return (
                                        <TouchableOpacity
                                            key={f}
                                            style={[styles.chip, active && styles.chipActive]}
                                            onPress={() => handleStatusFilter(f)}
                                            activeOpacity={0.75}
                                        >
                                            <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* ── Payment Filters ── */}
                        <View style={[styles.filterSection, { marginTop: 0 }]}>
                            <Text style={styles.filterLabel}>Payment</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                                {PAYMENT_FILTERS.map((f) => {
                                    const active = paymentFilter === f;
                                    return (
                                        <TouchableOpacity
                                            key={f}
                                            style={[styles.chip, active && styles.chipActiveGreen]}
                                            onPress={() => handlePaymentFilter(f)}
                                            activeOpacity={0.75}
                                        >
                                            <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        <Text style={styles.resultCount}>{sessions.length} session{sessions.length !== 1 ? "s" : ""}</Text>
                    </View>
                }

                ListEmptyComponent={
                    <View style={styles.emptyWrap}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="calendar-outline" size={44} color="#C4B5FD" />
                        </View>
                        <Text style={styles.emptyTitle}>No Sessions Found</Text>
                        <Text style={styles.emptySub}>
                            {search ? "Try a different search or filter" : "Your booked mentor sessions will appear here"}
                        </Text>
                    </View>
                }

                ListFooterComponent={
                    loadingMore ? (
                        <View style={styles.footerLoader}>
                            <ActivityIndicator size="small" color="#6C63FF" />
                            <Text style={styles.footerLoaderText}>Loading more…</Text>
                        </View>
                    ) : null
                }

                renderItem={({ item, index }) => (
                    <SessionCard item={item} index={index} navigation={navigation} />
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
    header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
    headerTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
    backBtn: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.18)",
        justifyContent: "center", alignItems: "center",
    },
    headerTitle: { fontSize: 19, fontWeight: "800", color: "#fff" },
    headerSub: { fontSize: 11, color: "rgba(255,255,255,0.72)", marginTop: 2 },
    totalPill: {
        backgroundColor: "rgba(255,255,255,0.22)",
        borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    },
    totalPillText: { color: "#fff", fontWeight: "700", fontSize: 13 },

    statsRow: {
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.12)",
        borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8, gap: 4,
    },
    statCard: { flex: 1, alignItems: "center", gap: 3 },
    statVal: { fontSize: 15, fontWeight: "800", color: "#fff" },
    statLbl: { fontSize: 9.5, color: "rgba(255,255,255,0.7)", fontWeight: "500" },

    // Search
    searchWrap: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#fff", marginHorizontal: 14, marginTop: 14,
        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
        gap: 8, borderWidth: 1, borderColor: "#EBEBF0",
    },
    searchInput: { flex: 1, fontSize: 13, color: "#111", padding: 0 },

    // Filters
    filterSection: { marginTop: 10 },
    filterLabel: {
        fontSize: 10, fontWeight: "700", color: "#9CA3AF",
        letterSpacing: 0.7, textTransform: "uppercase",
        marginLeft: 16, marginBottom: 6,
    },
    chipRow: { paddingHorizontal: 14, gap: 8 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 20, borderWidth: 1,
        borderColor: "#E5E7EB", backgroundColor: "#fff",
    },
    chipActive: { backgroundColor: "#6C63FF", borderColor: "#6C63FF" },
    chipActiveGreen: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
    chipTextActive: { color: "#fff" },

    resultCount: {
        fontSize: 11, color: "#9CA3AF", fontWeight: "500",
        marginLeft: 16, marginTop: 10, marginBottom: 4,
    },

    // Card
    card: {
        backgroundColor: "#fff",
        borderRadius: 16, marginHorizontal: 14, marginBottom: 14,
        borderWidth: 1, borderColor: "#EBEBF0",
        overflow: "hidden",
    },
    cardHeader: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 13, paddingTop: 13, paddingBottom: 11, gap: 10,
    },
    mentorPhoto: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: "#EEF2FF",
        borderWidth: 2, borderColor: "#E0E7FF",
    },
    mentorInfo: { flex: 1, gap: 4 },
    mentorName: { fontSize: 14, fontWeight: "700", color: "#111827" },
    metaChips: { flexDirection: "row", gap: 6 },
    miniChip: {
        flexDirection: "row", alignItems: "center", gap: 3,
        paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
    },
    miniChipText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
    statusBadge: {
        flexDirection: "row", alignItems: "center", gap: 3,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
    },
    statusBadgeText: { fontSize: 10, fontWeight: "700" },

    cardDivider: { height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 13 },

    // Date time row
    dateTimeRow: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 13, paddingVertical: 11,
    },
    dtBlock: { flex: 1, alignItems: "center", gap: 2 },
    dtSep: { width: 1, height: 32, backgroundColor: "#F3F4F6" },
    dtLabel: { fontSize: 9.5, color: "#9CA3AF", fontWeight: "500", marginTop: 2 },
    dtValue: { fontSize: 11.5, color: "#111827", fontWeight: "700", textAlign: "center" },

    // Countdown
    countdownBar: {
        flexDirection: "row", alignItems: "center", gap: 6,
        backgroundColor: "#EEF2FF", marginHorizontal: 13,
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 8,
    },
    countdownText: { fontSize: 12, color: "#4B5563" },
    countdownBold: { fontWeight: "700", color: "#6C63FF" },

    // Price
    priceRow: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 13, marginBottom: 4,
    },
    priceLeft: { gap: 2 },
    priceValue: { fontSize: 16, fontWeight: "800", color: "#111827" },
    priceSaved: { fontSize: 10.5, color: "#10B981", fontWeight: "600" },
    payBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    payBadgeText: { fontSize: 11, fontWeight: "700" },

    // Booking
    bookingRow: {
        flexDirection: "row", alignItems: "center", gap: 4,
        paddingHorizontal: 13, marginBottom: 11,
    },
    bookingId: { fontSize: 10, color: "#9CA3AF", flex: 1 },
    bookingDate: { fontSize: 10, color: "#9CA3AF" },

    // Actions
    actionsRow: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 13, paddingBottom: 13, gap: 8,
    },
    actionBtn: {
        flexDirection: "row", alignItems: "center", gap: 6,
        paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, flex: 1,
        justifyContent: "center",
    },
    joinBtn: { backgroundColor: "#ff6363" },
    joinBtnDisabled: { backgroundColor: "#fca5a5" },
    joinBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
    summaryBtn: { backgroundColor: "#EEF2FF", borderWidth: 1, borderColor: "#C7D2FE" },
    summaryBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
    rebookBtn: { backgroundColor: "#EF4444" },
    iconActionBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center",
        borderWidth: 1, borderColor: "#C7D2FE",
    },
    waitingBadge: {
        flex: 1, flexDirection: "row", alignItems: "center",
        backgroundColor: "#FFFBEB", borderRadius: 10,
        paddingVertical: 10, paddingHorizontal: 12,
        borderWidth: 1, borderColor: "#FDE68A",
    },
    waitingText: { fontSize: 12, color: "#92400E", fontWeight: "600" },

    // Empty
    emptyWrap: { alignItems: "center", marginTop: 70, paddingHorizontal: 32 },
    emptyIconBox: {
        width: 84, height: 84, borderRadius: 22,
        backgroundColor: "#EEF2FF",
        justifyContent: "center", alignItems: "center", marginBottom: 14,
    },
    emptyTitle: { fontSize: 17, fontWeight: "700", color: "#374151", marginBottom: 6 },
    emptySub: { fontSize: 13, color: "#9CA3AF", textAlign: "center", lineHeight: 19 },

    // Footer
    footerLoader: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, paddingVertical: 16,
    },
    footerLoaderText: { fontSize: 12, color: "#9CA3AF" },
});
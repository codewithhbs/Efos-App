import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StatusBar,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    ScrollView,
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

const RED = "#E8192C";
const RED_DARK = "#B5121F";
const RED_SOFT = "#FFF1F2";
const SLATE = "#64748B";
const TEXT = "#111827";
const BG = "#FAFAFA";

const STATUS_CONFIG = {
    selected: { color: "#059669", bg: "#ECFDF5", label: "Selected" },
    rejected: { color: "#DC2626", bg: "#FEF2F2", label: "Rejected" },
    pending: { color: "#D97706", bg: "#FFFBEB", label: "Pending" },
    applied: { color: "#2563EB", bg: "#EFF6FF", label: "Applied" },
};

const fmt = iso => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function MyAllApplications({ navigation }) {
    const { user } = useAuthStore();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");

    const fetchApplications = async (pageNo = 1, reset = false) => {
        try {
            if (pageNo === 1) setLoading(true);
            else setLoadingMore(true);

            const res = await API.get(
                `/auth/my-applications?page=${pageNo}&limit=10&status=${status}&search=${search}`
            );
            const json = res.data;

            setPage(json.page);
            setTotalPages(json.totalPages);

            if (reset) setApplications(json.data || []);
            else setApplications(prev => [...prev, ...(json.data || [])]);
        } catch (e) {
            console.log("Applications Error =>", e?.response?.data || e);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => { fetchApplications(1, true); }, [status]);

    const onRefresh = () => { setRefreshing(true); fetchApplications(1, true); };
    const loadMore = () => { if (page < totalPages && !loadingMore) fetchApplications(page + 1); };
    const handleSearch = () => fetchApplications(1, true);

    if (!user) return <AuthWarn />;
    if (loading) return <Loader />;

    const FILTERS = ["all", "applied", "pending", "selected", "rejected"];

    return (
        <SafeAreaView style={s.root}>
            <StatusBar barStyle="dark-content" backgroundColor={RED_DARK} />

            {/* ── Header ── */}
            <LinearGradient colors={[RED_DARK, RED]} style={s.header}>
                <View style={s.headerTop}>
                    <View>
                        <Text style={s.h1}>Applications</Text>
                        <Text style={s.h2}>Track your job journey</Text>
                    </View>
                    <View style={s.countPill}>
                        <Text style={s.countNum}>{applications.length}</Text>
                        <Text style={s.countLabel}>total</Text>
                    </View>
                </View>

                {/* Search */}
                <View style={s.searchRow}>
                    <Ionicons name="search-outline" size={17} color="rgba(255,255,255,0.7)" />
                    <TextInput
                        placeholder="Search by title, company…"
                        placeholderTextColor="rgba(255,255,255,0.55)"
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                        style={s.searchInput}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearch(""); fetchApplications(1, true); }}>
                            <Ionicons name="close-circle" size={17} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>


            {/* ── List ── */}
            <FlatList
                data={applications}
                keyExtractor={item => item.id.toString()}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={RED} />}
                onEndReached={loadMore}
                onEndReachedThreshold={0.4}
                contentContainerStyle={s.listContent}
                ListFooterComponent={
                    loadingMore
                        ? <ActivityIndicator color={RED} style={{ marginVertical: 18 }} />
                        : null
                }
                ListEmptyComponent={
                    <View style={s.empty}>
                        <View style={s.emptyIcon}>
                            <Ionicons name="briefcase-outline" size={38} color={RED} />
                        </View>
                        <Text style={s.emptyTitle}>No Applications Yet</Text>
                        <Text style={s.emptySub}>Applications you submit will appear here</Text>
                    </View>
                }
                renderItem={({ item }) => <ApplicationCard item={item} navigation={navigation} />}
            />
        </SafeAreaView>
    );
}

function ApplicationCard({ item, navigation }) {
    const cfg = STATUS_CONFIG[item.status] ?? { color: SLATE, bg: "#F1F5F9", label: item.status };
    const isUG = item.job_type === "UG";

    return (
        <TouchableOpacity
            style={s.card}
            activeOpacity={0.88}
            onPress={() => navigation.navigate("JobDetail", { slug: item.slug })}
        >
            {/* Left accent bar */}
            <View style={[s.accent, { backgroundColor: cfg.color }]} />

            <View style={s.cardBody}>
                {/* Top row: title + type badge */}
                <View style={s.cardTopRow}>
                    <Text style={s.jobTitle} numberOfLines={2}>{item.job_title}</Text>
                    <View style={s.typePill}>
                        <Text style={s.typeText}>{item.job_type}</Text>
                    </View>
                </View>

                {/* Company */}
                <View style={s.companyRow}>
                    <Ionicons name="business-outline" size={13} color={RED} />
                    <Text style={s.company} numberOfLines={1}>{item.company_name}</Text>
                </View>

                {/* Meta row */}
                <View style={s.metaStrip}>
                    <MetaItem icon="cash-outline" label={item.salary} />
                    {(item.state || item.district) && (
                        <MetaItem icon="location-outline" label={item.state ?? item.district} />
                    )}
                    <MetaItem icon="briefcase-outline" label={item.experience} />
                </View>

                {/* Divider */}
                <View style={s.divider} />

                {/* Footer */}
                <View style={s.cardFooter}>
                    <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
                        <View style={[s.dot, { backgroundColor: cfg.color }]} />
                        <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>

                    <View style={s.dateRow}>
                        <Ionicons name="calendar-outline" size={12} color={SLATE} />
                        <Text style={s.dateText}>{fmt(item.applied_at)}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

function MetaItem({ icon, label }) {
    if (!label) return null;
    return (
        <View style={s.metaItem}>
            <Ionicons name={icon} size={12} color={SLATE} />
            <Text style={s.metaText} numberOfLines={1}>{label}</Text>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },

    /* header */
    header: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18 },
    headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    h1: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
    h2: { color: "rgba(255,255,255,0.72)", fontSize: 13, marginTop: 2 },
    countPill: { backgroundColor: "rgba(0,0,0,0.18)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: "center" },
    countNum: { color: "#fff", fontSize: 20, fontWeight: "800" },
    countLabel: { color: "rgba(255,255,255,0.7)", fontSize: 10, marginTop: -2 },

    /* search */
    searchRow: { marginTop: 14, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.18)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
    searchInput: { flex: 1, color: "#fff", fontSize: 14, marginLeft: 8, padding: 0 },

    /* filters */
    filterScroll: { flexGrow: 0, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
    filterWrap: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "transparent" },
    chipActive: { backgroundColor: RED_SOFT, borderColor: RED },
    chipText: { fontSize: 12, fontWeight: "600", color: SLATE },
    chipTextActive: { color: RED },

    /* list */
    listContent: { padding: 14, paddingBottom: 90 },

    /* card */
    card: {
        backgroundColor: "#fff",
        borderRadius: 14,
        marginBottom: 12,
        flexDirection: "row",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#F1F5F9",
    },
    accent: { width: 4 },
    cardBody: { flex: 1, padding: 14 },

    cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    jobTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: TEXT, lineHeight: 21 },
    typePill: { backgroundColor: RED_SOFT, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 2 },
    typeText: { fontSize: 10, fontWeight: "700", color: RED, textTransform: "uppercase" },

    companyRow: { flexDirection: "row", alignItems: "center", marginTop: 5, gap: 5 },
    company: { fontSize: 13, color: RED, fontWeight: "600", flex: 1 },

    metaStrip: { flexDirection: "row", flexWrap: "wrap", marginTop: 10, gap: 10 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText: { fontSize: 12, color: SLATE },

    divider: { height: 1, backgroundColor: "#F1F5F9", marginTop: 12, marginBottom: 10 },

    cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 5 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 12, fontWeight: "700" },

    dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    dateText: { fontSize: 12, color: SLATE },

    /* empty */
    empty: { marginTop: 80, alignItems: "center", paddingHorizontal: 30 },
    emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: RED_SOFT, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: "700", color: TEXT },
    emptySub: { marginTop: 6, fontSize: 14, color: SLATE, textAlign: "center", lineHeight: 20 },
});
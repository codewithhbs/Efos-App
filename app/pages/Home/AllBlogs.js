import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import API from "../../utils/axiosInstanct";
import { COLORS } from "../../utils/dummyData";
import Layout from "../../components/layout";

const LIMIT = 10;
const { width } = Dimensions.get("window");
const CARD_W = (width - 16 * 2 - 12) / 2;

const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

let searchTimer = null;

export default function AllBlogs({ navigation }) {
    const [blogs, setBlogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoryId, setCategoryId] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);

    const fetchBlogs = useCallback(async (pageNo = 1, replace = false, opts = {}) => {
        const cat = opts.categoryId !== undefined ? opts.categoryId : categoryId;
        const q = opts.search !== undefined ? opts.search : search;
        try {
            let url = `/extra/blogs?page=${pageNo}&limit=${LIMIT}`;
            if (cat) url += `&category_id=${cat}`;
            if (q?.trim()) url += `&search=${encodeURIComponent(q.trim())}`;

            const res = await API.get(url);
            if (res.data?.success) {
                const list = res.data.data || [];
                setBlogs((prev) => (replace ? list : [...prev, ...list]));
                setTotalPages(res.data.pagination?.totalPages || 1);
                setTotal(res.data.pagination?.total || 0);
                setPage(pageNo);
                if (res.data.categories) setCategories(res.data.categories);
            }
        } catch (err) {
            console.error("[AllBlogs]", err?.response?.data || err?.message);
        }
    }, [categoryId, search]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await fetchBlogs(1, true, { categoryId, search });
            setLoading(false);
        })();
    }, [categoryId]);

    const onSearchChange = (val) => {
        setSearch(val);
        clearTimeout(searchTimer);
        searchTimer = setTimeout(async () => {
            setLoading(true);
            await fetchBlogs(1, true, { categoryId, search: val });
            setLoading(false);
        }, 450);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBlogs(1, true, { categoryId, search });
        setRefreshing(false);
    };

    const loadMore = async () => {
        if (loadingMore || page >= totalPages) return;
        setLoadingMore(true);
        await fetchBlogs(page + 1, false, { categoryId, search });
        setLoadingMore(false);
    };

    const clearSearch = () => onSearchChange("");

    const activeCategoryName = categoryId
        ? categories.find((c) => c.id === categoryId)?.name
        : "All Categories";

    const renderItem = ({ item, index }) => (
        <TouchableOpacity
            style={[s.card, { width: CARD_W, marginLeft: index % 2 === 0 ? 0 : 12 }]}
            activeOpacity={0.9}
            onPress={() => navigation.navigate("DetailsBlogs", { id: item.id })}
        >
            <View style={s.imgWrap}>
                <Image source={{ uri: item.image }} style={s.img} />
                <LinearGradient colors={["transparent", "rgba(0,0,0,0.5)"]} style={s.imgOverlay} />
                {item.category_name ? (
                    <View style={s.catPill}>
                        <Text style={s.catPillTxt} numberOfLines={1}>{item.category_name}</Text>
                    </View>
                ) : null}
            </View>

            <View style={s.body}>
                <Text style={s.title} numberOfLines={3}>{item.name}</Text>

                <View style={s.footerRow}>
                    <View style={s.dateRow}>
                        <Ionicons name="calendar-outline" size={10.5} color={COLORS.textLight} />
                        <Text style={s.date}>{fmtDate(item.created_at)}</Text>
                    </View>
                    <Ionicons name="arrow-forward-circle" size={18} color={COLORS.primary} />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <Layout title={"All Blogs"} headerType={"backTitle"}>
            <View style={s.root}>

                {/* Search bar */}
                <View style={s.searchBar}>
                    <Ionicons name="search" size={17} color={COLORS.textLight} />
                    <TextInput
                        value={search}
                        onChangeText={onSearchChange}
                        placeholder="Search blogs..."
                        placeholderTextColor={COLORS.textLight}
                        style={s.searchInput}
                        returnKeyType="search"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={clearSearch} hitSlop={10}>
                            <Ionicons name="close-circle" size={17} color={COLORS.textLight} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Category dropdown */}
                {categories.length > 0 && (
                    <View style={{ zIndex: 20 }}>
                        <TouchableOpacity
                            style={s.dropdownBtn}
                            activeOpacity={0.85}
                            onPress={() => setPickerOpen((p) => !p)}
                        >
                            <Ionicons name="filter-outline" size={15} color={COLORS.primary} />
                            <Text style={s.dropdownTxt} numberOfLines={1}>{activeCategoryName}</Text>
                            <Ionicons name={pickerOpen ? "chevron-up" : "chevron-down"} size={15} color={COLORS.textLight} />
                        </TouchableOpacity>

                        {pickerOpen && (
                            <View style={s.dropdownList}>
                                <FlatList
                                    data={[{ id: null, name: `All Categories`, blog_count: total }, ...categories]}
                                    keyExtractor={(item, idx) => `catopt-${item.id}-${idx}`}
                                    style={{ maxHeight: 280 }}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[s.dropdownItem, categoryId === item.id && s.dropdownItemActive]}
                                            onPress={() => {
                                                setCategoryId(item.id);
                                                setPickerOpen(false);
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    s.dropdownItemTxt,
                                                    categoryId === item.id && s.dropdownItemTxtActive,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {item.name}
                                            </Text>
                                            <Text style={s.dropdownItemCount}>{item.blog_count}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        )}
                    </View>
                )}

                {blogs.length > 0 && !loading && (
                    <Text style={s.resultCount}>
                        {total} article{total !== 1 ? "s" : ""} found
                    </Text>
                )}

                {loading ? (
                    <View style={s.center}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={s.loadingTxt}>Loading blogs...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={blogs}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={renderItem}
                        numColumns={2}
                        contentContainerStyle={s.list}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[COLORS.primary]}
                                tintColor={COLORS.primary}
                            />
                        }
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.4}
                        ListFooterComponent={
                            loadingMore ? (
                                <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
                            ) : page >= totalPages && blogs.length ? (
                                <Text style={s.endTxt}>— You've reached the end —</Text>
                            ) : null
                        }
                        ListEmptyComponent={
                            <View style={s.center}>
                                <View style={s.emptyIconWrap}>
                                    <Ionicons name="newspaper-outline" size={36} color={COLORS.primary} />
                                </View>
                                <Text style={s.emptyTxt}>No blogs found</Text>
                                <Text style={s.emptySubTxt}>Try a different search or category</Text>
                            </View>
                        }
                    />
                )}

            </View>
        </Layout>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#F6F7F9", paddingHorizontal: 16 },

    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
        height: 46,
        gap: 8,
        marginTop: 14,
    },
    searchInput: { flex: 1, fontSize: 13.5, color: COLORS.text, fontWeight: "500" },

    dropdownBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
        height: 40,
        gap: 8,
        marginTop: 10,
        alignSelf: "flex-start",
        maxWidth: "80%",
    },
    dropdownTxt: { fontSize: 12.5, fontWeight: "700", color: COLORS.text, flexShrink: 1 },

    dropdownList: {
        marginTop: 6,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 6,
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F2F5",
    },
    dropdownItemActive: { backgroundColor: "#EFF1FF" },
    dropdownItemTxt: { fontSize: 12.5, fontWeight: "600", color: COLORS.text, flex: 1 },
    dropdownItemTxtActive: { color: COLORS.primary, fontWeight: "800" },
    dropdownItemCount: { fontSize: 10.5, fontWeight: "700", color: COLORS.textLight, marginLeft: 8 },

    resultCount: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.textLight,
        marginTop: 12,
        marginBottom: 2,
    },

    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 80 },
    loadingTxt: { fontSize: 12.5, color: COLORS.textLight, fontWeight: "600", marginTop: 6 },
    emptyIconWrap: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: "#EFF1FF",
        alignItems: "center", justifyContent: "center",
        marginBottom: 6,
    },
    emptyTxt: { fontSize: 14, color: COLORS.text, fontWeight: "800" },
    emptySubTxt: { fontSize: 12, color: COLORS.textLight, fontWeight: "500" },
    endTxt: { textAlign: "center", fontSize: 11, color: COLORS.textLight, marginVertical: 18 },

    list: { paddingVertical: 14, paddingBottom: 24 },

    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    imgWrap: { width: "100%", height: 110, backgroundColor: COLORS.card },
    img: { width: "100%", height: "100%" },
    imgOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, height: 40 },
    catPill: {
        position: "absolute",
        left: 8,
        bottom: 6,
        backgroundColor: "rgba(0,0,0,0.55)",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 16,
        maxWidth: "85%",
    },
    catPillTxt: { fontSize: 9, fontWeight: "700", color: "#fff" },

    body: { padding: 10, gap: 8 },
    title: { fontSize: 12.5, fontWeight: "800", color: COLORS.text, lineHeight: 17, minHeight: 51 },

    footerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 2,
    },
    dateRow: { flexDirection: "row", alignItems: "center", gap: 3 },
    date: { fontSize: 9.5, color: COLORS.textLight, fontWeight: "600" },

    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    modalSheet: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: { fontSize: 15, fontWeight: "800", color: COLORS.text },
});
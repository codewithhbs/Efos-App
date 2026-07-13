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
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import API from "../../utils/axiosInstanct";
import { COLORS } from "../../utils/dummyData";
import Layout, { HeaderIconButton } from "../../components/layout";

const LIMIT = 10;

const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function AllBlogs({ navigation }) {
    const [blogs, setBlogs] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBlogs = useCallback(async (pageNo = 1, replace = false) => {
        try {
            const res = await API.get(`/extra/blogs?page=${pageNo}&limit=${LIMIT}`);
            if (res.data?.success) {
                const list = res.data.data || [];
                setBlogs((prev) => (replace ? list : [...prev, ...list]));
                setTotalPages(res.data.pagination?.totalPages || 1);
                setPage(pageNo);
            }
        } catch (err) {
            console.error("[AllBlogs]", err?.response?.data || err?.message);
        }
    }, []);

    useEffect(() => {
        (async () => {
            await fetchBlogs(1, true);
            setLoading(false);
        })();
    }, [fetchBlogs]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBlogs(1, true);
        setRefreshing(false);
    };

    const loadMore = async () => {
        if (loadingMore || page >= totalPages) return;
        setLoadingMore(true);
        await fetchBlogs(page + 1);
        setLoadingMore(false);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={s.card}
            activeOpacity={0.9}
            onPress={() => navigation.navigate("DetailsBlogs", { id: item.id })}
        >
            <Image source={{ uri: item.image }} style={s.img} />
            <View style={s.body}>
                <View style={s.dateRow}>
                    <Ionicons name="calendar-outline" size={11} color={COLORS.textLight} />
                    <Text style={s.date}>{fmtDate(item.created_at)}</Text>
                </View>
                <Text style={s.title} numberOfLines={3}>{item.name}</Text>
                <View style={s.readRow}>
                    <Text style={s.readTxt}>Read More</Text>
                    <Ionicons name="chevron-forward" size={12} color={COLORS.primary} />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <Layout
        title={"All Blogs"}
            headerType={"backTitle"}
        >

   


                {loading ? (
                    <View style={s.center}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={blogs}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={renderItem}
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
                                <Ionicons name="newspaper-outline" size={40} color={COLORS.textLight} />
                                <Text style={s.emptyTxt}>No blogs found</Text>
                            </View>
                        }
                    />
                )}

        </Layout>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#F6F7F9" },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },

    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 60 },
    emptyTxt: { fontSize: 13, color: COLORS.textLight, fontWeight: "600" },
    endTxt: { textAlign: "center", fontSize: 11, color: COLORS.textLight, marginVertical: 16 },

    list: { padding: 16, gap: 14 },

    card: {
        flexDirection: "row",
        backgroundColor: COLORS.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
    },
    img: { width: 110, height: "100%", minHeight: 110, backgroundColor: COLORS.card },
    body: { flex: 1, padding: 12, gap: 5, justifyContent: "center" },

    dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    date: { fontSize: 10.5, color: COLORS.textLight, fontWeight: "600" },

    title: { fontSize: 13.5, fontWeight: "700", color: COLORS.text, lineHeight: 19 },

    readRow: { flexDirection: "row", alignItems: "center", gap: 2 },
    readTxt: { fontSize: 11.5, fontWeight: "800", color: COLORS.primary },
});
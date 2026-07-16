import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    ActivityIndicator,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import API from "../../utils/axiosInstanct";
import { COLORS } from "../../utils/dummyData";

const { width } = Dimensions.get("window");
const CARD_W = width * 0.68;

const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function BlogsComponent() {
    const navigation = useNavigation();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBlogs = useCallback(async () => {
        try {
            const res = await API.get("/extra/blogs?forHome=true");
            if (res.data?.success) setBlogs(res.data.data || []);
        } catch (err) {
            console.error("[BlogsComponent]", err?.response?.data || err?.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

    if (loading) {
        return (
            <View style={s.loadBox}>
                <ActivityIndicator color={COLORS.primary} />
            </View>
        );
    }

    if (!blogs.length) return null;

    return (
        <View style={s.wrap}>
            {/* Header */}
            <View style={s.head}>
                <View style={s.headLeft}>
                    <View style={s.headBar} />
                    <Text style={s.headTitle}>Career Updates</Text>
                </View>
                <TouchableOpacity
                    style={s.viewAll}
                    onPress={() => navigation.navigate("AllBlogs")}
                    hitSlop={8}
                >
                    <Text style={s.viewAllTxt}>View All</Text>
                    <Ionicons name="arrow-forward" size={13} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Horizontal list */}
            <FlatList
                data={blogs.slice(0, 10)}
                keyExtractor={(item) => String(item.id)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.list}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={s.card}
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate("DetailsBlogs", { id: item.id })}
                    >
                        <Image source={{ uri: item.image }} resizeMode={"contain"} style={s.img} />
                        <View style={s.body}>
                            <View style={s.dateRow}>
                                <Ionicons name="calendar-outline" size={11} color={COLORS.textLight} />
                                <Text style={s.date}>{fmtDate(item.created_at)}</Text>
                            </View>
                            <Text style={s.title} numberOfLines={2}>{item.name}</Text>
                            <View style={s.readRow}>
                                <Text style={s.readTxt}>Read More</Text>
                                <Ionicons name="chevron-forward" size={12} color={COLORS.primary} />
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const s = StyleSheet.create({
    wrap: { marginTop: 8, marginBottom: 16 },
    loadBox: { height: 120, alignItems: "center", justifyContent: "center" },

    head: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
        marginBottom: 12,
    },
    headLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    headBar: { width: 3.5, height: 16, borderRadius: 2, backgroundColor: COLORS.primary },
    headTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },

    viewAll: { flexDirection: "row", alignItems: "center", gap: 3 },
    viewAllTxt: { fontSize: 12.5, fontWeight: "700", color: COLORS.primary },

    list: { paddingHorizontal: 18, gap: 12 },

    card: {
        width: CARD_W,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
    },
    img: { width: "100%", height: 130, backgroundColor: COLORS.card },
    body: { padding: 12, gap: 6 },

    dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    date: { fontSize: 10.5, color: COLORS.textLight, fontWeight: "600" },

    title: { fontSize: 13.5, fontWeight: "700", color: COLORS.text, lineHeight: 19 },

    readRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
    readTxt: { fontSize: 11.5, fontWeight: "800", color: COLORS.primary },
});
import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StatusBar,
    Dimensions,
    Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import API from "../../utils/axiosInstanct";
import { COLORS } from "../../utils/dummyData";

const { width } = Dimensions.get("window");

const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default function DetailsBlogs({ navigation, route }) {
    const { id } = route.params || {};
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [webHeight, setWebHeight] = useState(0);
    const fetchBlog = useCallback(async () => {
        try {
            const res = await API.get(`/extra/blogs/${id}`);
            if (res.data?.success) setBlog(res.data.data);
            else setError(true);
        } catch (err) {
            console.error("[DetailsBlogs]", err?.response?.data || err?.message);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchBlog(); }, [fetchBlog]);

    const onShare = () => {
        if (!blog) return;
        Share.share({
            message: `${blog.name}\n\nRead on EFOS: https://efos.in/blog/${blog.slug}`,
        });
    };

    // API me content field ka naam differ ho sakta hai — jo mile use karo
    const htmlContent =
        blog?.content || blog?.description || blog?.long_content || blog?.short_content || "";

    return (
        <SafeAreaView style={s.root} edges={["top"]}>
            <StatusBar barStyle={"dark-content"} />

            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} style={s.headBtn}>
                    <Ionicons name="arrow-back" size={20} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={s.headTitle} numberOfLines={1}>Blog</Text>
                <TouchableOpacity onPress={onShare} hitSlop={10} style={s.headBtn}>
                    <Ionicons name="share-social-outline" size={19} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={s.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : error || !blog ? (
                <View style={s.center}>
                    <Ionicons name="alert-circle-outline" size={40} color={COLORS.textLight} />
                    <Text style={s.errTxt}>Blog not found</Text>
                    <TouchableOpacity style={s.retryBtn} onPress={() => { setLoading(true); setError(false); fetchBlog(); }}>
                        <Text style={s.retryTxt}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                    {!!blog.image && <Image source={{ uri: blog.image }} resizeMode="contain" style={s.hero} />}

                    <View style={s.content}>
                        <View style={s.metaRow}>
                            <View style={s.datePill}>
                                <Ionicons name="calendar-outline" size={11} color={COLORS.primary} />
                                <Text style={s.dateTxt}>{fmtDate(blog.created_at)}</Text>
                            </View>
                        </View>

                        <Text style={s.title}>{blog.name}</Text>

                        <View style={s.divider} />

                        {htmlContent ? (
                            <WebView
                                originWhitelist={["*"]}
                                scrollEnabled={false}
                                bounces={false}
                                nestedScrollEnabled={false}
                                overScrollMode="never"
                                showsVerticalScrollIndicator={false}
                                automaticallyAdjustContentInsets={false}
                                javaScriptEnabled
                                domStorageEnabled
                                style={{
                                    width: "100%",
                                    height: Math.max(webHeight, 100),
                                    backgroundColor: "transparent",
                                }}
                                onMessage={(event) => {
                                    setWebHeight(Number(event.nativeEvent.data));
                                }}
                                injectedJavaScript={`
    function sendHeight() {
      const height = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      window.ReactNativeWebView.postMessage(height.toString());
    }

    window.onload = sendHeight;

    setTimeout(sendHeight, 100);
    setTimeout(sendHeight, 500);
    setTimeout(sendHeight, 1000);

    true;
  `}
                                source={{
                                    html: `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
html,body{
    margin:0;
    padding:0;
    overflow:hidden;
    background:#fff;
    font-size:16px;
    line-height:1.8;
    color:#374151;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
}

*{
    box-sizing:border-box;
}

img{
    max-width:100%;
    height:auto;
    display:block;
    margin:12px auto;
    border-radius:12px;
}
</style>
</head>
<body>
${htmlContent}
</body>
</html>
`,
                                }}
                            />
                        ) : (
                            <Text style={s.noContent}>Content not available.</Text>
                        )}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#fff" },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F2F5",
    },
    headBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#F4F5F7",
        alignItems: "center",
        justifyContent: "center",
    },
    headTitle: { fontSize: 15.5, fontWeight: "800", color: COLORS.text },

    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
    errTxt: { fontSize: 13.5, color: COLORS.textLight, fontWeight: "600" },
    retryBtn: {
        paddingHorizontal: 22,
        paddingVertical: 9,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
    },
    retryTxt: { color: "#fff", fontSize: 12.5, fontWeight: "800" },

    scroll: { paddingBottom: 40 },
    hero: { width: "100%", height: 220, backgroundColor: "#F4F5F7" },

    content: { padding: 18, paddingBottom: 65, },

    metaRow: { flexDirection: "row", marginBottom: 10 },
    datePill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 20,
    },
    dateTxt: { fontSize: 11, fontWeight: "700", color: COLORS.primaryDark },

    title: { fontSize: 20, fontWeight: "800", color: COLORS.text, lineHeight: 28 },

    divider: { height: 1, backgroundColor: "#F1F2F5", marginVertical: 16 },

    noContent: { fontSize: 13.5, color: COLORS.textLight, textAlign: "center", paddingVertical: 30 },
});
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    View, Text, TouchableOpacity, Alert,
    ActivityIndicator, StyleSheet, Modal,
    TextInput, FlatList, Animated, Dimensions,
    ScrollView, Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { Loader } from "../../components/LoadingAndAuthWarn";
import { useCourse } from "../../hooks/useCourse";
import API from "../../utils/axiosInstanct";
import {
    CFPaymentGatewayService,
} from "react-native-cashfree-pg-sdk";
import {
    CFEnvironment, CFSession, CFThemeBuilder, CFDropCheckoutPayment,
} from "cashfree-pg-api-contract";
import Layout from "../../components/layout";
import { COLORS } from "../../utils/dummyData";
import ChapterAccordion from "./Chapteraccordion";

const { width, height } = Dimensions.get("window");

// ─── palette ──────────────────────────────────────────────────────────────────
const C = {
    red: COLORS.primary,
    redDark: COLORS.primaryDark,
    redLight: COLORS.primaryLight,
    green: COLORS.success,
    greenLight: "#dcfce7",
    greenDark: "#15803d",
    amber: COLORS.warning,
    amberLight: "#fffbeb",
    blue: "#3b82f6",
    blueLight: "#eff6ff",
    gray50: "#f9fafb",
    gray100: "#f3f4f6",
    gray200: COLORS.border,
    gray300: "#d1d5db",
    gray400: COLORS.textLight,
    gray500: COLORS.textSecondary,
    gray700: "#374151",
    gray900: COLORS.text,
    white: COLORS.white,
    black: COLORS.secondary,
};

// ─── HTML renderer ─────────────────────────────────────────────────────────────
const buildHtml = (html) => `
<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, sans-serif; font-size: 14px; line-height: 1.75;
         color: #374151; background: transparent; padding: 0 2px; }
  h1,h2,h3 { color: #111827; margin: 14px 0 6px; font-size: 16px; }
  p { margin-bottom: 10px; }
  ul,ol { padding-left: 18px; margin-bottom: 10px; }
  li { margin-bottom: 4px; }
  strong { color: #111827; }
  img { max-width: 100%; border-radius: 8px; }
  a { color: ${COLORS.primary}; }
</style>
</head><body>${html}</body></html>`;

// ─── tiny helpers ──────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, valueColor, last }) => (
    <View style={[s.infoRow, last && { borderBottomWidth: 0 }]}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={[s.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
);

const Chip = ({ icon, label }) => (
    <View style={s.chip}>
        <Ionicons name={icon} size={11} color={C.gray500} />
        <Text style={s.chipTxt}>{label}</Text>
    </View>
);

// ─── PAYMENT STATUS MODAL ──────────────────────────────────────────────────────
const PaymentStatusModal = ({ visible, status, message, onClose, onRetry }) => {
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, friction: 7, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
            ]).start();
        } else {
            scaleAnim.setValue(0.8);
            fadeAnim.setValue(0);
        }
    }, [visible]);

    const cfg = {
        success: { icon: "checkmark-circle", color: C.green, bg: C.greenLight, title: "Payment Successful!" },
        failed: { icon: "close-circle", color: C.red, bg: C.redLight, title: "Payment Failed" },
        cancelled: { icon: "arrow-undo-circle", color: C.amber, bg: C.amberLight, title: "Payment Cancelled" },
        pending: { icon: "time", color: C.blue, bg: C.blueLight, title: "Payment Pending" },
        loading: { icon: "sync", color: C.blue, bg: C.blueLight, title: "Verifying..." },
    }[status] || { icon: "help", color: C.gray400, bg: C.gray100, title: "Processing..." };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
                <Animated.View style={[s.statusCard, { transform: [{ scale: scaleAnim }] }]}>
                    <View style={[s.statusBand, { backgroundColor: cfg.color }]} />
                    <View style={[s.statusIconBox, { backgroundColor: cfg.bg }]}>
                        {status === "loading"
                            ? <ActivityIndicator size="large" color={cfg.color} />
                            : <Ionicons name={cfg.icon} size={46} color={cfg.color} />}
                    </View>
                    <Text style={s.statusTitle}>{cfg.title}</Text>
                    <Text style={s.statusMsg}>{message}</Text>
                    {status !== "loading" && (
                        <View style={s.statusActions}>
                            {(status === "failed" || status === "cancelled") && onRetry && (
                                <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.red }]} onPress={onRetry}>
                                    <Ionicons name="refresh" size={13} color={C.white} />
                                    <Text style={[s.actionBtnTxt, { color: C.white }]}>Try Again</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[s.actionBtn, { backgroundColor: C.gray100, flex: status === "success" ? 1 : undefined }]}
                                onPress={onClose}
                            >
                                <Text style={[s.actionBtnTxt, { color: C.gray700 }]}>
                                    {status === "success" ? "Go to Classroom →" : "Dismiss"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

// ─── COUPON BOTTOM SHEET ──────────────────────────────────────────────────────
const CouponModal = ({ visible, courseId, onClose, onApply }) => {
    const slideAnim = useRef(new Animated.Value(height)).current;
    const [coupons, setCoupons] = useState([]);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [manualCode, setManualCode] = useState("");
    const [applyLoading, setApplyLoading] = useState(false);
    const [appliedCode, setAppliedCode] = useState(null);

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }).start();
            fetchCoupons();
        } else {
            Animated.timing(slideAnim, { toValue: height, duration: 260, useNativeDriver: true }).start();
        }
    }, [visible]);

    const fetchCoupons = async () => {
        try {
            setFetchLoading(true);
            const res = await API.get("/auth/available-coupons");
            setCoupons(res.data?.data || []);
        } catch (e) {
            console.log("[availableCoupons] error =>", e?.response?.data || e.message);
        } finally {
            setFetchLoading(false);
        }
    };

    const handleApply = async (code) => {
        const c = (code || manualCode).trim().toUpperCase();
        if (!c) return;
        try {
            setApplyLoading(true);
            const res = await API.post("/auth/apply-coupon", { courseId, couponCode: c });
            if (res.data.success) {
                setAppliedCode(c);
                onApply(res.data.data);
                onClose();
            } else {
                Alert.alert("Invalid Coupon", res.data.message);
            }
        } catch (e) {
            Alert.alert("Error", e?.response?.data?.message || "Unable to apply coupon.");
        } finally {
            setApplyLoading(false);
        }
    };

    const renderCoupon = ({ item }) => {
        const invalid = !item.valid;
        const isApplied = appliedCode === item.code;
        return (
            <View style={[s.couponRow, invalid && { opacity: 0.4 }]}>
                <View style={[s.couponAccent, { backgroundColor: invalid ? C.gray300 : C.red }]} />
                <View style={s.couponBody}>
                    <View style={s.couponTop}>
                        <View style={s.codePill}>
                            <Text style={s.codeTxt}>{item.code}</Text>
                        </View>
                        <Text style={s.saveTxt}>
                            {item.discount_type === "flat"
                                ? `₹${item.discount_value} OFF`
                                : `${item.discount_value}% OFF`}
                        </Text>
                    </View>
                    <Text style={s.couponTitle} numberOfLines={1}>{item.title}</Text>
                    {item.description ? (
                        <Text style={s.couponDesc} numberOfLines={2}>{item.description}</Text>
                    ) : null}
                    <View style={s.couponBottom}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                            <Ionicons name="time-outline" size={10} color={C.gray400} />
                            <Text style={s.expiryTxt}>
                                {item.expires_at
                                    ? `Expires ${new Date(item.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                                    : "No expiry"}
                            </Text>
                        </View>
                        {!invalid ? (
                            <TouchableOpacity
                                style={[s.couponApplyBtn, isApplied && { backgroundColor: C.greenLight, borderColor: C.green }]}
                                onPress={() => handleApply(item.code)}
                                disabled={applyLoading}
                            >
                                {applyLoading
                                    ? <ActivityIndicator size="small" color={C.red} />
                                    : <Text style={[s.couponApplyTxt, isApplied && { color: C.green }]}>
                                        {isApplied ? "Applied ✓" : "Apply"}
                                    </Text>}
                            </TouchableOpacity>
                        ) : (
                            <View style={s.invalidBadge}>
                                <Text style={s.invalidTxt}>{item.reason}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <View style={s.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
                <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={s.sheetHandle} />
                    <View style={s.sheetHeader}>
                        <Text style={s.sheetTitle}>Apply Coupon</Text>
                        <TouchableOpacity onPress={onClose} style={s.closeCircle}>
                            <Ionicons name="close" size={16} color={C.gray700} />
                        </TouchableOpacity>
                    </View>
                    <View style={s.manualRow}>
                        <TextInput
                            style={s.couponInput}
                            placeholder="Enter coupon code"
                            placeholderTextColor={C.gray400}
                            value={manualCode}
                            onChangeText={(t) => setManualCode(t.toUpperCase())}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity
                            style={[s.manualBtn, (!manualCode.trim() || applyLoading) && { opacity: 0.5 }]}
                            onPress={() => handleApply()}
                            disabled={applyLoading || !manualCode.trim()}
                        >
                            {applyLoading
                                ? <ActivityIndicator size="small" color={C.white} />
                                : <Text style={s.manualBtnTxt}>Apply</Text>}
                        </TouchableOpacity>
                    </View>
                    <Text style={s.listLabel}>AVAILABLE COUPONS</Text>
                    {fetchLoading ? (
                        <ActivityIndicator color={C.red} style={{ marginTop: 24 }} />
                    ) : coupons.length === 0 ? (
                        <View style={s.emptyBox}>
                            <Ionicons name="pricetag-outline" size={36} color={C.gray200} />
                            <Text style={s.emptyTxt}>No coupons available right now</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={coupons}
                            keyExtractor={(item) => String(item.id)}
                            renderItem={renderCoupon}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ gap: 10, paddingBottom: 32 }}
                        />
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

// ─── STATS ROW ─────────────────────────────────────────────────────────────────
function StatsRow({ courseDetails }) {
    const chapters = courseDetails.chapters || [];
    const totalLessons = chapters.reduce((a, ch) => a + (ch.lessons?.length || 0), 0);
    const totalSecs = chapters.reduce((a, ch) =>
        a + (ch.lessons || []).reduce((b, l) => b + (l.duration_seconds || 0), 0), 0);
    const totalMin = Math.round(totalSecs / 60);

    const stats = [
        { icon: "layers-outline", label: `${chapters.length} Chapters` },
        { icon: "play-circle-outline", label: `${totalLessons} Lessons` },
        ...(totalMin > 0 ? [{ icon: "time-outline", label: `${totalMin} min` }] : []),
        ...(courseDetails.level ? [{ icon: "bar-chart-outline", label: courseDetails.level }] : []),
        ...(courseDetails.language ? [{ icon: "language-outline", label: courseDetails.language }] : []),
    ];

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.statsRow}
        >
            {stats.map((st, i) => (
                <View key={i} style={s.statItem}>
                    <View style={s.statIconWrap}>
                        <Ionicons name={st.icon} size={16} color={C.red} />
                    </View>
                    <Text style={s.statLabel}>{st.label}</Text>
                </View>
            ))}
        </ScrollView>
    );
}

// ─── MAIN SCREEN ───────────────────────────────────────────────────────────────
export default function CourseDetails({ route, navigation }) {
    const { courseId, userId, user } = route.params || {};
    const { courseDetails, loading, refetch } = useCourse({ id: courseId, userId });

    const [payLoading, setPayLoading] = useState(false);
    const [couponModal, setCouponModal] = useState(false);
    const [statusModal, setStatusModal] = useState(false);
    const [payStatus, setPayStatus] = useState("loading");
    const [payMsg, setPayMsg] = useState("");
    const [couponData, setCouponData] = useState(null);
    const [webViewHeight, setWebViewHeight] = useState(200);
    const [showAllInfo, setShowAllInfo] = useState(false);

    const basePrice = useMemo(() => {
        if (!courseDetails) return 0;
        if (Number(courseDetails.is_free) === 1) return 0;
        if (Number(courseDetails.has_discount) === 1 && courseDetails.discount_price)
            return Number(courseDetails.discount_price);
        return Number(courseDetails.price);
    }, [courseDetails]);

    const finalPrice = couponData ? couponData.finalAmount : basePrice;
    const discountSaved = couponData ? couponData.discountAmount : 0;
    const isFree = finalPrice === 0;
    const isPurchased = !!courseDetails?.purchaseStatus;

    // CashFree callbacks
    useEffect(() => {
        CFPaymentGatewayService.setCallback({
            onVerify: (order_id) => verifyPayment(order_id),
            onError: (error) => {
                setPayLoading(false);
                setPayStatus("cancelled");
                setPayMsg(error?.message || "Payment was cancelled. Please try again.");
                setStatusModal(true);
            },
        });
        return () => CFPaymentGatewayService.removeCallback();
    }, []);

    const startPayment = async () => {
        try {
            setPayLoading(true);
            const payload = {
                userId, courseId,
                customer_name: user?.name || "Student",
                customer_email: user?.email || "student@gmail.com",
                customer_phone: user?.phone || "9999999999",
                couponCode: couponData?.coupon_code || undefined,
            };
            const res = await API.post("/auth/create-order", payload);
            if (!res.data.success) {
                setPayLoading(false);
                Alert.alert("Error", res.data.message);
                return;
            }
            if (res.data.data?.isFree) {
                setPayLoading(false);
                setPayStatus("success");
                setPayMsg(res.data.message);
                setStatusModal(true);
                refetch();
                return;
            }
            const { payment_session_id, order_id, environment } = res.data.data;
            const session = new CFSession(
                payment_session_id, order_id,
                environment === "PRODUCTION" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX
            );
            const theme = new CFThemeBuilder()
                .setNavigationBarBackgroundColor(C.red)
                .setNavigationBarTextColor(C.white)
                .setButtonBackgroundColor(C.red)
                .setButtonTextColor(C.white)
                .build();
            CFPaymentGatewayService.doPayment(new CFDropCheckoutPayment(session, null, theme));
        } catch (error) {
            setPayLoading(false);
            Alert.alert("Error", error?.response?.data?.message || "Unable to create payment. Please try again.");
        }
    };

    const verifyPayment = async (order_id) => {
        try {
            setPayStatus("loading");
            setPayMsg("Verifying your payment...");
            setStatusModal(true);
            const res = await API.post("/auth/verify-payment", { order_id, userId });
            setPayLoading(false);
            const st = res.data.data?.status || (res.data.success ? "success" : "pending");
            setPayStatus(st);
            setPayMsg(res.data.message);
            if (res.data.success) refetch();
        } catch (error) {
            setPayLoading(false);
            setPayStatus("failed");
            setPayMsg(error?.response?.data?.message || "Verification failed. Please contact support.");
        }
    };

    const handleStatusClose = () => {
        setStatusModal(false);
        if (payStatus === "success") navigation.navigate("Classroom", { courseId });
    };

    const webViewScript = `
        window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'height', value: document.body.scrollHeight })
        ); true;
    `;

    if (loading || !courseDetails) return <Loader message="Loading course details..." />;

    const isHtml = courseDetails.description && /<[a-z][\s\S]*>/i.test(courseDetails.description);
    const chapters = courseDetails.chapters || [];

    // Lesson counts for header display
    const totalLessons = chapters.reduce((a, ch) => a + (ch.lessons?.length || 0), 0);
    const freeLessons = chapters.reduce((a, ch) =>
        a + (ch.lessons || []).filter((l) => l.is_free_preview === 1).length, 0);

    return (
        <Layout
            headerType="backTitle"
            title={courseDetails?.title}
            subtitle={courseDetails?.short_description}
            scrollable={true}
            onBack={() => navigation.goBack()}
        >
            <ScrollView
                style={s.root}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                contentContainerStyle={{ paddingBottom: 120 }}
            >

                {/* ── HERO THUMBNAIL ── */}
                <View style={s.heroBox}>
                    <Image
                        source={{ uri: courseDetails.thumbnail }}
                        style={s.heroImg}
                        resizeMode="cover"
                    />
                    {/* Gradient overlay bottom */}
                    <View style={s.heroOverlay} />
                    {/* Badges top-right */}
                    <View style={s.heroBadges}>
                        {Number(courseDetails.is_free) === 1 && (
                            <View style={[s.heroBadge, { backgroundColor: C.green }]}>
                                <Text style={s.heroBadgeTxt}>FREE</Text>
                            </View>
                        )}
                        {courseDetails.level && (
                            <View style={[s.heroBadge, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
                                <Text style={s.heroBadgeTxt}>{courseDetails.level.toUpperCase()}</Text>
                            </View>
                        )}
                        {Number(courseDetails.featured) === 1 && (
                            <View style={[s.heroBadge, { backgroundColor: C.amber }]}>
                                <Ionicons name="star" size={9} color={C.white} />
                                <Text style={s.heroBadgeTxt}>FEATURED</Text>
                            </View>
                        )}
                    </View>
                    {/* Demo video button bottom-left */}
                    {courseDetails.demo_video && (
                        <View style={s.demoBtn}>
                            <Ionicons name="play-circle" size={15} color={C.white} />
                            <Text style={s.demoBtnTxt}>Preview</Text>
                        </View>
                    )}
                </View>

                {/* ── BODY ── */}
                <View style={s.body}>

                    {/* ── TITLE BLOCK ── */}
                    <View style={s.titleBlock}>
                        <Text style={s.title}>{courseDetails.title}</Text>
                        <Text style={s.subtitle} numberOfLines={3}>
                            {courseDetails.short_description}
                        </Text>
                        {/* Chips */}
                        <View style={s.chips}>
                            {courseDetails.language && <Chip icon="language-outline" label={courseDetails.language} />}
                            {courseDetails.duration && <Chip icon="time-outline" label={courseDetails.duration} />}
                            {courseDetails.level && <Chip icon="bar-chart-outline" label={courseDetails.level} />}
                        </View>
                    </View>

                    {/* ── STATS ROW ── */}
                    <StatsRow courseDetails={courseDetails} />

                    {/* ── ENROLLED BANNER ── */}
                    {isPurchased && (
                        <View style={s.enrolledBanner}>
                            <View style={s.enrolledIconWrap}>
                                <Ionicons name="checkmark-circle" size={22} color={C.green} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.enrolledTitle}>You're Enrolled!</Text>
                                <Text style={s.enrolledSub}>Access all {totalLessons} lessons anytime</Text>
                            </View>
                            <TouchableOpacity
                                style={s.goClassBtn}
                                onPress={() => navigation.navigate("Classroom", { courseId })}
                            >
                                <Text style={s.goClassTxt}>Open</Text>
                                <Ionicons name="arrow-forward" size={12} color={C.white} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── PRICE CARD ── */}
                    {!isPurchased && (
                        <View style={s.priceCard}>
                            <View style={s.priceLeft}>
                                <Text style={s.priceLabel}>COURSE PRICE</Text>
                                <View style={s.priceRow}>
                                    <Text style={s.priceMain}>
                                        {isFree ? "FREE" : `₹${finalPrice}`}
                                    </Text>
                                    {!isFree && basePrice !== finalPrice && (
                                        <Text style={s.priceStrike}>₹{basePrice}</Text>
                                    )}
                                    {Number(courseDetails.has_discount) === 1 && !couponData && (
                                        <View style={s.discountTag}>
                                            <Text style={s.discountTagTxt}>
                                                {Math.round(((Number(courseDetails.price) - basePrice) / Number(courseDetails.price)) * 100)}% OFF
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                {discountSaved > 0 && (
                                    <View style={s.savedBadge}>
                                        <Ionicons name="pricetag" size={9} color={C.green} />
                                        <Text style={s.savedTxt}>Saving ₹{discountSaved.toFixed(0)}</Text>
                                    </View>
                                )}
                            </View>
                            {!isFree && (
                                couponData ? (
                                    <View style={s.appliedBox}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                            <Ionicons name="checkmark-circle" size={13} color={C.green} />
                                            <Text style={s.appliedCode}>{couponData.coupon_code}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setCouponData(null)}>
                                            <Text style={s.removeTxt}>Remove</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity style={s.couponBtn} onPress={() => setCouponModal(true)}>
                                        <Ionicons name="pricetag-outline" size={13} color={C.red} />
                                        <Text style={s.couponBtnTxt}>Add Coupon</Text>
                                    </TouchableOpacity>
                                )
                            )}
                        </View>
                    )}

                    {/* ── WHAT YOU'LL LEARN ── */}
                    {courseDetails.what_you_learn && (
                        <View style={s.card}>
                            <View style={s.cardHeader}>
                                <View style={s.cardIconWrap}>
                                    <Ionicons name="bulb-outline" size={15} color={C.red} />
                                </View>
                                <Text style={s.cardTitle}>What you'll learn</Text>
                            </View>
                            <View style={s.divider} />
                            <View style={s.learnGrid}>
                                {courseDetails.what_you_learn.split("\n").filter(Boolean).map((item, i) => (
                                    <View key={i} style={s.learnRow}>
                                        <View style={s.learnDot}>
                                            <Ionicons name="checkmark" size={10} color={C.white} />
                                        </View>
                                        <Text style={s.learnTxt}>{item.trim()}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ── COURSE CONTENT (accordion) ── */}
                    {freeLessons.length > 0 && (
    <View style={s.card}>
                        <View style={s.cardHeader}>
                            <View style={s.cardIconWrap}>
                                <Ionicons name="layers-outline" size={15} color={C.red} />
                            </View>
                            <Text style={s.cardTitle}>Course Content</Text>
                            <View style={s.contentMeta}>
                                <Text style={s.contentMetaTxt}>
                                    {chapters.length} chapters · {totalLessons} lessons
                                </Text>
                                {freeLessons > 0 && (
                                    <View style={s.freePreviewBadge}>
                                        <Text style={s.freePreviewTxt}>{freeLessons} free</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={s.divider} />
                        <ChapterAccordion
                            chapters={chapters}
                            onPressLesson={() => {
                                // Preview only — full access in classroom
                                if (!isPurchased) {
                                    Alert.alert(
                                        "Enroll to Watch",
                                        "Purchase this course to access all lessons.",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            { text: "Enroll Now", onPress: startPayment },
                                        ]
                                    );
                                }
                            }}
                        />
                    </View>
                    )}
                

                    {/* ── ABOUT ── */}
                    {courseDetails.description && (
                        <View style={s.card}>
                            <View style={s.cardHeader}>
                                <View style={s.cardIconWrap}>
                                    <Ionicons name="information-circle-outline" size={15} color={C.red} />
                                </View>
                                <Text style={s.cardTitle}>About this Course</Text>
                            </View>
                            <View style={s.divider} />
                            {isHtml ? (
                                <WebView
                                    originWhitelist={["*"]}
                                    source={{ html: buildHtml(courseDetails.description) }}
                                    style={{ height: webViewHeight, backgroundColor: "transparent" }}
                                    scrollEnabled={false}
                                    showsVerticalScrollIndicator={false}
                                    injectedJavaScript={webViewScript}
                                    onMessage={(e) => {
                                        try {
                                            const msg = JSON.parse(e.nativeEvent.data);
                                            if (msg.type === "height") setWebViewHeight(msg.value + 16);
                                        } catch { }
                                    }}
                                />
                            ) : (
                                <Text style={s.bodyText}>{courseDetails.description}</Text>
                            )}
                        </View>
                    )}

                    {/* ── COURSE INFO ── */}
                    <View style={s.card}>
                        <TouchableOpacity
                            style={s.cardHeader}
                            onPress={() => setShowAllInfo((v) => !v)}
                            activeOpacity={0.8}
                        >
                            <View style={s.cardIconWrap}>
                                <Ionicons name="reader-outline" size={15} color={C.red} />
                            </View>
                            <Text style={[s.cardTitle, { flex: 1 }]}>Course Info</Text>
                            <Ionicons
                                name={showAllInfo ? "chevron-up" : "chevron-down"}
                                size={16}
                                color={C.gray400}
                            />
                        </TouchableOpacity>
                        <View style={s.divider} />
                        <InfoRow label="Course ID" value={`#${courseDetails.id}`} />
                        <InfoRow label="Language" value={courseDetails.language || "—"} />
                        <InfoRow label="Duration" value={courseDetails.duration || "—"} />
                        <InfoRow label="Level" value={courseDetails.level || "—"} />
                        <InfoRow
                            label="Price"
                            value={Number(courseDetails.is_free) === 1 ? "Free" : `₹${courseDetails.price}`}
                            valueColor={Number(courseDetails.is_free) === 1 ? C.green : C.gray900}
                        />
                        {showAllInfo && (
                            <>
                                <InfoRow label="Currency" value={courseDetails.currency || "INR"} />
                                {Number(courseDetails.has_discount) === 1 && courseDetails.discount_price && (
                                    <>
                                        <InfoRow label="Discount Price" value={`₹${courseDetails.discount_price}`} valueColor={C.red} />
                                        <InfoRow label="Discount From" value={courseDetails.discount_from ? new Date(courseDetails.discount_from).toLocaleDateString("en-IN") : "—"} />
                                        <InfoRow label="Discount To" value={courseDetails.discount_to ? new Date(courseDetails.discount_to).toLocaleDateString("en-IN") : "—"} last />
                                    </>
                                )}
                            </>
                        )}
                    </View>

                </View>
            </ScrollView>

            {/* ── STICKY CTA ── */}
            <View style={s.stickyBar}>
                {isPurchased ? (
                    <TouchableOpacity
                        style={[s.ctaBtn, { backgroundColor: C.green }]}
                        onPress={() => navigation.navigate("Classroom", { courseId })}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="play-circle" size={18} color={C.white} />
                        <Text style={s.ctaTxt}>Continue Learning</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={s.ctaRow}>
                        <View style={s.ctaPriceBox}>
                            <Text style={s.ctaPrice}>{isFree ? "FREE" : `₹${finalPrice}`}</Text>
                            {!isFree && basePrice !== finalPrice && (
                                <Text style={s.ctaPriceStrike}>₹{basePrice}</Text>
                            )}
                        </View>
                        <TouchableOpacity
                            style={[s.ctaBtn, s.ctaBtnFlex, payLoading && { opacity: 0.7 }]}
                            onPress={startPayment}
                            disabled={payLoading}
                            activeOpacity={0.85}
                        >
                            {payLoading ? (
                                <ActivityIndicator color={C.white} />
                            ) : (
                                <>
                                    <Ionicons
                                        name={isFree ? "school-outline" : "card-outline"}
                                        size={17}
                                        color={C.white}
                                    />
                                    <Text style={s.ctaTxt}>
                                        {isFree ? "Enroll Free" : "Buy Now"}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* ── Modals ── */}
            <CouponModal
                visible={couponModal}
                courseId={courseId}
                onClose={() => setCouponModal(false)}
                onApply={(data) => setCouponData(data)}
            />
            <PaymentStatusModal
                visible={statusModal}
                status={payStatus}
                message={payMsg}
                onClose={handleStatusClose}
                onRetry={() => { setStatusModal(false); setTimeout(startPayment, 400); }}
            />
        </Layout>
    );
}

// ─── styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.gray50 },

    // Hero
    heroBox: { height: 230, overflow: "hidden", position: "relative" },
    heroImg: { width: "100%", height: 230 },
    heroOverlay: {
        position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
        backgroundColor: "transparent",
    },
    heroBadges: {
        position: "absolute", top: 12, right: 12,
        flexDirection: "row", gap: 6,
    },
    heroBadge: {
        borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
        flexDirection: "row", alignItems: "center", gap: 3,
    },
    heroBadgeTxt: { fontSize: 9, fontWeight: "800", color: C.white, letterSpacing: 0.6 },
    demoBtn: {
        position: "absolute", bottom: 12, left: 12,
        flexDirection: "row", alignItems: "center", gap: 5,
        backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 6,
    },
    demoBtnTxt: { fontSize: 12, fontWeight: "700", color: C.white },

    // Body
    body: { padding: 14, gap: 14 },

    // Title
    titleBlock: { gap: 6 },
    title: { fontSize: 20, fontWeight: "900", color: C.gray900, letterSpacing: -0.4 },
    subtitle: { fontSize: 13, color: C.gray500, lineHeight: 19 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
    chip: {
        flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: C.gray100, borderRadius: 20,
        paddingHorizontal: 9, paddingVertical: 4,
    },
    chipTxt: { fontSize: 11, color: C.gray700, fontWeight: "500" },

    // Stats
    statsRow: {
        paddingHorizontal: 2, gap: 10, paddingVertical: 2,
    },
    statItem: {
        alignItems: "center", gap: 5,
        backgroundColor: C.white, borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 10,
        borderWidth: 1, borderColor: C.gray200,
    },
    statIconWrap: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: C.redLight,
        alignItems: "center", justifyContent: "center",
    },
    statLabel: { fontSize: 11, fontWeight: "600", color: C.gray700 },

    // Enrolled
    enrolledBanner: {
        flexDirection: "row", alignItems: "center", gap: 12,
        backgroundColor: C.greenLight, borderRadius: 14,
        padding: 14, borderWidth: 1, borderColor: "#bbf7d0",
    },
    enrolledIconWrap: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: C.white, alignItems: "center", justifyContent: "center",
    },
    enrolledTitle: { fontSize: 14, fontWeight: "800", color: C.green },
    enrolledSub: { fontSize: 11, color: C.greenDark, marginTop: 1 },
    goClassBtn: {
        backgroundColor: C.green, borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 7,
        flexDirection: "row", alignItems: "center", gap: 4,
    },
    goClassTxt: { fontSize: 12, fontWeight: "700", color: C.white },

    // Price card
    priceCard: {
        backgroundColor: C.white, borderRadius: 16,
        borderWidth: 1, borderColor: C.gray200,
        padding: 16, flexDirection: "row",
        alignItems: "center", gap: 12,
    },
    priceLeft: { flex: 1, gap: 4 },
    priceLabel: { fontSize: 9, color: C.gray400, fontWeight: "700", letterSpacing: 0.8 },
    priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" },
    priceMain: { fontSize: 30, fontWeight: "900", color: C.gray900, letterSpacing: -0.5 },
    priceStrike: { fontSize: 14, color: C.gray400, textDecorationLine: "line-through" },
    discountTag: {
        backgroundColor: C.redLight, borderRadius: 6,
        paddingHorizontal: 6, paddingVertical: 2,
    },
    discountTagTxt: { fontSize: 10, fontWeight: "800", color: C.red },
    savedBadge: {
        flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: C.greenLight, alignSelf: "flex-start",
        borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3,
    },
    savedTxt: { fontSize: 10, fontWeight: "700", color: C.green },
    couponBtn: {
        flexDirection: "row", alignItems: "center", gap: 5,
        backgroundColor: C.redLight, borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 9,
        borderWidth: 1, borderColor: "#f5d0d0",
    },
    couponBtnTxt: { fontSize: 12, fontWeight: "700", color: C.red },
    appliedBox: {
        backgroundColor: C.gray50, borderRadius: 10,
        padding: 9, alignItems: "center", gap: 4,
        borderWidth: 1, borderColor: C.gray200,
    },
    appliedCode: { fontSize: 11, fontWeight: "800", color: C.gray900 },
    removeTxt: { fontSize: 10, color: C.gray400, textDecorationLine: "underline" },

    // Card
    card: {
        backgroundColor: C.white, borderRadius: 16,
        borderWidth: 1, borderColor: C.gray200,
        overflow: "hidden",
    },
    cardHeader: {
        flexDirection: "row", alignItems: "center", gap: 10,
        padding: 14,
    },
    cardIconWrap: {
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: C.redLight,
        alignItems: "center", justifyContent: "center",
    },
    cardTitle: { fontSize: 15, fontWeight: "800", color: C.gray900 },
    contentMeta: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "flex-end" },
    contentMetaTxt: { fontSize: 11, color: C.gray400 },
    freePreviewBadge: {
        backgroundColor: "#dcfce7", borderRadius: 4,
        paddingHorizontal: 6, paddingVertical: 2,
    },
    freePreviewTxt: { fontSize: 9, fontWeight: "700", color: C.green },
    divider: { height: 1, backgroundColor: C.gray100 },
    bodyText: { fontSize: 13, color: C.gray500, lineHeight: 20, padding: 14 },

    // Learn
    learnGrid: { padding: 14, gap: 10 },
    learnRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    learnDot: {
        width: 18, height: 18, borderRadius: 9,
        backgroundColor: C.red,
        alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: 1,
    },
    learnTxt: { flex: 1, fontSize: 13, color: C.gray700, lineHeight: 19 },

    // Info rows
    infoRow: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", paddingVertical: 11,
        paddingHorizontal: 14,
        borderBottomWidth: 1, borderBottomColor: C.gray100,
    },
    infoLabel: { fontSize: 13, color: C.gray500 },
    infoValue: { fontSize: 13, fontWeight: "600", color: C.gray900, maxWidth: "60%", textAlign: "right" },

    // Sticky CTA
    stickyBar: {
        position: "absolute", bottom: 0, left: 0, right: 0,
        backgroundColor: C.white, padding: 12, paddingBottom: 28,
        borderTopWidth: 1, borderTopColor: C.gray100,
        shadowColor: "#000", shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 10,
    },
    ctaRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    ctaPriceBox: { alignItems: "center" },
    ctaPrice: { fontSize: 20, fontWeight: "900", color: C.gray900 },
    ctaPriceStrike: { fontSize: 11, color: C.gray400, textDecorationLine: "line-through" },
    ctaBtn: {
        borderRadius: 14, flexDirection: "row", backgroundColor: C.red,
        alignItems: "center", justifyContent: "center",
        gap: 8, paddingVertical: 14,
    },
    ctaBtnFlex: { flex: 1 },
    ctaTxt: { fontSize: 15, fontWeight: "800", color: C.white, letterSpacing: 0.2 },

    // Overlay / modals
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    statusCard: {
        width: width * 0.84, backgroundColor: C.white,
        borderRadius: 24, overflow: "hidden",
        alignItems: "center", paddingBottom: 24,
    },
    statusBand: { width: "100%", height: 6 },
    statusIconBox: {
        width: 86, height: 86, borderRadius: 43,
        alignItems: "center", justifyContent: "center",
        marginTop: 24, marginBottom: 12,
    },
    statusTitle: { fontSize: 18, fontWeight: "800", color: C.gray900, marginBottom: 6 },
    statusMsg: {
        fontSize: 13, color: C.gray500, textAlign: "center",
        lineHeight: 20, paddingHorizontal: 24, marginBottom: 20,
    },
    statusActions: { flexDirection: "row", gap: 10, paddingHorizontal: 20, width: "100%" },
    actionBtn: {
        flex: 1, flexDirection: "row", alignItems: "center",
        justifyContent: "center", gap: 6,
        paddingVertical: 13, borderRadius: 10,
    },
    actionBtnTxt: { fontSize: 13, fontWeight: "700" },

    // Coupon sheet
    sheet: {
        position: "absolute", bottom: 0, left: 0, right: 0,
        backgroundColor: C.white,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: height * 0.82, padding: 16, paddingTop: 10,
    },
    sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.gray200, alignSelf: "center", marginBottom: 12 },
    sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
    sheetTitle: { fontSize: 16, fontWeight: "800", color: C.gray900 },
    closeCircle: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: C.gray100, alignItems: "center", justifyContent: "center",
    },
    manualRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
    couponInput: {
        flex: 1, backgroundColor: C.gray50, borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 11,
        fontSize: 14, fontWeight: "600", color: C.gray900,
        borderWidth: 1, borderColor: C.gray200, letterSpacing: 1,
    },
    manualBtn: {
        backgroundColor: C.red, borderRadius: 10,
        paddingHorizontal: 18, alignItems: "center", justifyContent: "center",
    },
    manualBtnTxt: { fontSize: 13, fontWeight: "700", color: C.white },
    listLabel: { fontSize: 10, fontWeight: "700", color: C.gray400, letterSpacing: 0.8, marginBottom: 10 },
    couponRow: {
        flexDirection: "row", backgroundColor: C.white,
        borderRadius: 12, overflow: "hidden",
        borderWidth: 1, borderColor: C.gray100,
    },
    couponAccent: { width: 5 },
    couponBody: { flex: 1, padding: 12, gap: 4 },
    couponTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    codePill: {
        backgroundColor: C.redLight, borderRadius: 6,
        paddingHorizontal: 8, paddingVertical: 3,
        borderWidth: 1, borderColor: "#f5d0d0", borderStyle: "dashed",
    },
    codeTxt: { fontSize: 11, fontWeight: "800", color: C.red, letterSpacing: 1 },
    saveTxt: { fontSize: 12, fontWeight: "800", color: C.green },
    couponTitle: { fontSize: 13, fontWeight: "700", color: C.gray900 },
    couponDesc: { fontSize: 11, color: C.gray500, lineHeight: 16 },
    couponBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
    expiryTxt: { fontSize: 10, color: C.gray400 },
    couponApplyBtn: {
        backgroundColor: C.redLight, borderRadius: 6,
        paddingHorizontal: 12, paddingVertical: 5,
        borderWidth: 1, borderColor: "#f5d0d0",
    },
    couponApplyTxt: { fontSize: 11, fontWeight: "700", color: C.red },
    invalidBadge: { backgroundColor: C.gray100, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
    invalidTxt: { fontSize: 10, fontWeight: "600", color: C.gray400 },
    emptyBox: { alignItems: "center", gap: 8, paddingVertical: 32 },
    emptyTxt: { fontSize: 13, color: C.gray400 },
});
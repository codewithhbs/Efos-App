import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Dimensions,
    ScrollView,
    Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import Layout from "../../components/layout";
import API from "../../utils/axiosInstanct";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import useAuthStore from "../../store/useAuthStore";

// Cashfree Drop-in checkout SDK. Import names match
// `react-native-cashfree-pg-sdk` — adjust if your installed version
// differs.
import {
    CFPaymentGatewayService,

} from "react-native-cashfree-pg-sdk";
import {
    CFErrorResponse, CFEnvironment,
    CFSession,
    CFDropCheckoutPayment,
    CFThemeBuilder,
} from "cashfree-pg-api-contract";

const RED = "#D32F2F";
const RED_DARK = "#B71C1C";
const WHITE = "#FFFFFF";
const BLACK = "#000000";
const GREY = "#767676";
const LIGHT_GREY = "#F4F4F4";
const BORDER = "#EBEBEB";

const SCREEN_WIDTH = Dimensions.get("window").width;

// Wraps raw HTML so it inherits sane typography/colors inside the WebView.
const wrapHtml = (html) => `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 8px 2px;
            font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif;
            font-size: 15px;
            line-height: 1.6;
            color: #000000;
            background-color: #ffffff;
          }
          img { max-width: 100%; height: auto; border-radius: 8px; }
          h1, h2, h3 { color: #000000; }
          a { color: #D32F2F; }
        </style>
      </head>
      <body>${html || ""}</body>
    </html>
`;

export default function BundleDetails() {
    const navigation = useNavigation();
    const route = useRoute();
    const { bundleId } = route.params || {};
    const user = useAuthStore((state) => state.user);

    const [bundle, setBundle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [webViewHeight, setWebViewHeight] = useState(300);

    // 'none' | 'pending' | 'success' | 'failed'
    const [purchaseStatus, setPurchaseStatus] = useState("none");
    const [statusLoading, setStatusLoading] = useState(true);
    const [buying, setBuying] = useState(false);
    const [pendingOrderId, setPendingOrderId] = useState(null);

    // ══════════════════════════════════════
    // FETCH BUNDLE
    // ══════════════════════════════════════
    const fetchBundleDetails = useCallback(async () => {
        if (!bundleId) {
            setError("Missing bundle id.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const res = await API.get(`/bundle/get-single-bundle/${bundleId}`);

            if (res?.data?.success) {
                setBundle(res.data.data);
            } else {
                setError("Unable to load bundle details.");
            }
        } catch (err) {
            console.error("[BundleDetails] fetch error", err);
            setError("Something went wrong while loading this bundle.");
        } finally {
            setLoading(false);
        }
    }, [bundleId]);

    // ══════════════════════════════════════
    // FETCH PURCHASE STATUS
    // ══════════════════════════════════════
    const fetchPurchaseStatus = useCallback(async () => {
        if (!bundleId) return;

        try {
            setStatusLoading(true);

            const res = await API.get(`/bundle/${bundleId}/purchase-status`);

            if (res?.data?.success) {
                const { status, transaction_id } = res.data.data;
                setPurchaseStatus(status);
                setPendingOrderId(status === "pending" ? transaction_id : null);
            }
        } catch (err) {
            console.error("[BundleDetails] purchase-status error", err);
            // Non-fatal — buy button just falls back to "Buy Bundle".
        } finally {
            setStatusLoading(false);
        }
    }, [bundleId]);

    useEffect(() => {
        fetchBundleDetails();
        fetchPurchaseStatus();
    }, [fetchBundleDetails, fetchPurchaseStatus]);

    // ══════════════════════════════════════
    // CASHFREE CALLBACKS
    // ══════════════════════════════════════
    useEffect(() => {
        CFPaymentGatewayService.setCallback({
            onVerify: (orderID) => {
                verifyPaymentWithBackend(orderID);
            },
            onError: (error, orderID) => {
                setBuying(false);
                console.error("[BundleDetails] Cashfree error", error, orderID);
                Alert.alert(
                    "Payment Cancelled",
                    error?.message || "Payment was not completed. You can retry anytime."
                );
                fetchPurchaseStatus();
            },
        });

        return () => {
            CFPaymentGatewayService.removeCallback();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openCashfreeCheckout = (order_id, payment_session_id, environment) => {
        console.log(CFEnvironment.SANDBOX)
        try {
            const session = new CFSession(
                payment_session_id,
                order_id,
                environment === "sandbox" ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION // switch to CFEnvironment.PRODUCTION for live
            );

            const theme = new CFThemeBuilder()
                .setNavigationBarBackgroundColor(RED)
                .setNavigationBarTextColor(WHITE)
                .setButtonBackgroundColor(RED)
                .setButtonTextColor(WHITE)
                .setPrimaryTextColor(BLACK)
                .setSecondaryTextColor(GREY)
                .build();

            const dropPayment = new CFDropCheckoutPayment(session, null, theme);
            CFPaymentGatewayService.doPayment(dropPayment);
        } catch (err) {
            setBuying(false);
            console.error("[BundleDetails] launch checkout error", err);
            Alert.alert("Error", "Unable to open payment screen. Please try again.");
        }
    };

    // ══════════════════════════════════════
    // VERIFY WITH BACKEND
    // ══════════════════════════════════════
    const verifyPaymentWithBackend = async (order_id) => {
        try {
            const res = await API.post("/bundle/verify-payment", { order_id });

            const status = res?.data?.data?.status;

            if (res?.data?.success && status === "success") {
                setPurchaseStatus("success");
                setPendingOrderId(null);

                Alert.alert(
                    "Payment Successful",
                    "You're now enrolled in this bundle.",
                    [{ text: "OK" }]
                );
            } else if (status === "pending") {
                setPurchaseStatus("pending");
                setPendingOrderId(order_id);

                Alert.alert(
                    "Payment Processing",
                    "We're still confirming your payment. Please check back shortly."
                );
            } else {
                setPurchaseStatus("failed");
                setPendingOrderId(null);

                Alert.alert(
                    "Payment Failed",
                    res?.data?.message || "Payment could not be verified. Please try again."
                );
            }
        } catch (err) {
            console.error("[BundleDetails] verify-payment error", err);
            Alert.alert(
                "Verification Error",
                "Unable to confirm payment right now. Pull down to refresh in a moment."
            );
        } finally {
            setBuying(false);
        }
    };

    // ══════════════════════════════════════
    // BUY BUNDLE
    // ══════════════════════════════════════
    const handleBuyBundle = async () => {
        if (!bundle) return;

        // Already owned — go straight to bundle content instead of buying again.
        if (purchaseStatus === "success") {
            navigation.navigate("MyBundleCourses", { bundleId: bundle.id });
            return;
        }

        // Payment already in flight for this bundle — resume verification
        // instead of creating a brand new order.

        if (!user?.name || !user?.email || !user?.phone) {
            Alert.alert(
                "Profile Incomplete",
                "Please complete your name, email and phone in your profile before purchasing."
            );
            return;
        }

        try {
            setBuying(true);

            const res = await API.post(`/bundle/${bundle.id}/init-payment`, {
                customer_name: user.name,
                customer_email: user.email,
                customer_phone: user.phone,
            });

            if (!res?.data?.success) {
                setBuying(false);
                Alert.alert("Unable to Proceed", res?.data?.message || "Please try again.");
                return;
            }

            // Free bundle — backend already enrolled the user, nothing to pay.
            if (res.data.data?.isFree) {
                setBuying(false);
                setPurchaseStatus("success");

                Alert.alert(
                    "Bundle Activated",
                    "This free bundle has been added to your account.",
                    [{ text: "OK" }]
                );
                return;
            }

            // Paid bundle — launch Cashfree with the returned session.
            console.log(res.data.data)
            const { order_id, payment_session_id, environment } = res.data.data;
            setPendingOrderId(order_id);
            openCashfreeCheckout(order_id, payment_session_id, environment);
        } catch (err) {
            setBuying(false);
            console.error("[BundleDetails] init-payment error", err);

            if (err?.response?.status === 409) {
                setPurchaseStatus("success");
                Alert.alert("Already Purchased", "You already own this bundle.");
                return;
            }

            Alert.alert("Error", "Unable to start purchase. Please try again.");
        }
    };

    const handleNavigate = (courseId) => {
        navigation.navigate("CourseDetail", { courseId, userId: user?.id });
    };

    const handleBuyCourse = (course) => {
        navigation.navigate("CourseDetail", { courseId, userId: user?.id });

    };

    // Injected JS reports rendered content height back to RN so the WebView
    // isn't a fixed-height scroll box nested inside the outer scroll view.
    const injectedJavaScript = `
        (function() {
          const height = document.body.scrollHeight;
          window.ReactNativeWebView.postMessage(String(height));
        })();
        true;
    `;

    if (loading) {
        return (
            <Layout
                headerType="backTitle"
                onBack={() => navigation.goBack()}
                title={"Bundle Details"}
            >
                <View style={styles.centerFill}>
                    <ActivityIndicator size="large" color={RED} />
                </View>
            </Layout>
        );
    }

    if (error || !bundle) {
        return (
            <Layout
                headerType="backTitle"
                onBack={() => navigation.goBack()}
                title={"Bundle Details"}
            >
                <View style={styles.centerFill}>
                    <Ionicons name="alert-circle-outline" size={36} color={GREY} />
                    <Text style={styles.errorText}>{error || "Bundle not found."}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchBundleDetails}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </Layout>
        );
    }

    const hasDiscount = bundle.has_discount && bundle.discount_price;
    const isFree = bundle.is_free === 1;
    const discountPercent = hasDiscount
        ? Math.round(
            (1 - parseFloat(bundle.discount_price) / parseFloat(bundle.price)) * 100
        )
        : 0;

    const footerButtonLabel =
        purchaseStatus === "success"
            ? "Go to Courses"
            : purchaseStatus === "pending"
                ? "Buy Bundle"
                : isFree
                    ? "Get Free Bundle"
                    : "Buy Bundle";

    return (
        <Layout
            headerType="backTitle"
            subtitle={"Home > Bundle Courses > " + bundle.title}
            onBack={() => navigation.goBack()}
            title={bundle.title}
        >
            <View style={styles.container}>
                <ScrollView>
                    <View style={styles.scrollArea}>
                        <View style={styles.heroWrapper}>
                            {bundle.thumbnail ? (
                                <Image
                                    source={{ uri: bundle.thumbnail }}
                                    style={styles.heroImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={[styles.heroImage, styles.heroPlaceholder]}>
                                    <Ionicons name="albums-outline" size={48} color={WHITE} />
                                </View>
                            )}

                            {purchaseStatus === "success" ? (
                                <View style={[styles.heroBadge, styles.ownedBadge]}>
                                    <Ionicons name="checkmark-circle" size={13} color={WHITE} />
                                    <Text style={styles.heroBadgeText}> OWNED</Text>
                                </View>
                            ) : isFree ? (
                                <View style={[styles.heroBadge, styles.freeBadge]}>
                                    <Text style={styles.heroBadgeText}>FREE</Text>
                                </View>
                            ) : hasDiscount ? (
                                <View style={styles.heroBadge}>
                                    <Text style={styles.heroBadgeText}>{discountPercent}% OFF</Text>
                                </View>
                            ) : null}
                        </View>

                        <View style={styles.content}>
                            <Text style={styles.title}>{bundle.title}</Text>

                            <View style={styles.priceRow}>
                                {isFree ? (
                                    <Text style={styles.freeText}>Free</Text>
                                ) : hasDiscount ? (
                                    <>
                                        <Text style={styles.discountPrice}>
                                            {bundle.currency || "₹"}
                                            {bundle.discount_price}
                                        </Text>
                                        <Text style={styles.originalPrice}>
                                            {bundle.currency || "₹"}
                                            {bundle.price}
                                        </Text>
                                    </>
                                ) : (
                                    <Text style={styles.discountPrice}>
                                        {bundle.currency || "₹"}
                                        {bundle.price}
                                    </Text>
                                )}
                            </View>

                            {purchaseStatus === "pending" && (
                                <View style={styles.pendingBanner}>
                                    <Ionicons name="time-outline" size={16} color={RED_DARK} />
                                    <Text style={styles.pendingBannerText}>
                                        Payment in progress. Tap below to resume or check status.
                                    </Text>
                                </View>
                            )}

                            {bundle.short_description ? (
                                <Text style={styles.shortDescription}>
                                    {bundle.short_description}
                                </Text>
                            ) : null}

                            <View style={styles.divider} />

                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Courses in this Bundle</Text>
                                <View style={styles.countPill}>
                                    <Text style={styles.countPillText}>
                                        {bundle.courses?.length || 0}
                                    </Text>
                                </View>
                            </View>

                            {(bundle.courses || []).map((course) => (
                                <View key={course.id} style={styles.courseCard}>
                                    {course.thumbnail ? (
                                        <Image
                                            source={{
                                                uri: course.thumbnail.startsWith("http")
                                                    ? course.thumbnail
                                                    : `https://efos.in/public/${course.thumbnail}`,
                                            }}
                                            style={styles.courseThumb}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View
                                            style={[styles.courseThumb, styles.courseThumbPlaceholder]}
                                        >
                                            <Ionicons name="book-outline" size={22} color={WHITE} />
                                        </View>
                                    )}

                                    <View style={styles.courseInfo}>
                                        <Text style={styles.courseTitle} numberOfLines={2}>
                                            {course.title}
                                        </Text>
                                        {course.short_description ? (
                                            <Text style={styles.courseDesc} numberOfLines={2}>
                                                {course.short_description}
                                            </Text>
                                        ) : null}

                                        <Text style={styles.coursePrice}>
                                            {course.is_free
                                                ? "Free"
                                                : `${course.currency || "₹"}${course.price}`}
                                        </Text>

                                        <View style={styles.courseActions}>
                                            <TouchableOpacity
                                                style={styles.viewDetailsButton}
                                                onPress={() => handleNavigate(course.id)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={styles.viewDetailsText}>
                                                    View Details
                                                </Text>
                                            </TouchableOpacity>

                                            {purchaseStatus !== "success" && (
                                                <TouchableOpacity
                                                    style={styles.buyButton}
                                                    onPress={() => handleBuyCourse(course)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Text style={styles.buyButtonText}>Buy</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            ))}

                            {bundle.description ? (
                                <>
                                    <View style={styles.divider} />
                                    <Text style={styles.sectionTitle}>About this Bundle</Text>
                                    <View
                                        style={[styles.webViewWrapper, { height: webViewHeight }]}
                                    >
                                        <WebView
                                            originWhitelist={["*"]}
                                            source={{ html: wrapHtml(bundle.description) }}
                                            injectedJavaScript={injectedJavaScript}
                                            onMessage={(event) => {
                                                const h = parseInt(event.nativeEvent.data, 10);
                                                if (!Number.isNaN(h) && h > 0) {
                                                    setWebViewHeight(h);
                                                }
                                            }}
                                            scrollEnabled={false}
                                            style={{
                                                width: SCREEN_WIDTH - 32,
                                                backgroundColor: WHITE,
                                            }}
                                        />
                                    </View>
                                </>
                            ) : null}

                            <View style={{ height: 100 }} />
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.stickyFooter}>
                    <View>
                        {isFree ? (
                            <Text style={styles.footerFree}>Free</Text>
                        ) : (
                            <View style={styles.footerPriceRow}>
                                <Text style={styles.footerPrice}>
                                    {"₹"}
                                    {hasDiscount ? bundle.discount_price : bundle.price}
                                </Text>
                                {hasDiscount && (
                                    <Text style={styles.footerOriginal}>
                                        {"₹"}
                                        {bundle.price}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.footerBuyButton,
                            purchaseStatus === "success" && styles.footerOwnedButton,
                        ]}
                        onPress={handleBuyBundle}
                        activeOpacity={0.85}
                        disabled={buying || statusLoading}
                    >
                        {buying ? (
                            <ActivityIndicator size="small" color={WHITE} />
                        ) : (
                            <>
                                <Text style={styles.footerBuyButtonText}>
                                    {footerButtonLabel}
                                </Text>
                                <Ionicons name="arrow-forward" size={15} color={WHITE} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
    },
    scrollArea: {
        flex: 1,
    },
    heroWrapper: {
        position: "relative",
    },
    heroImage: {
        width: "100%",
        height: 190,
        backgroundColor: LIGHT_GREY,
    },
    heroPlaceholder: {
        backgroundColor: RED,
        alignItems: "center",
        justifyContent: "center",
    },
    heroBadge: {
        position: "absolute",
        top: 12,
        left: 12,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: RED_DARK,
        borderRadius: 8,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    freeBadge: {
        backgroundColor: RED,
    },
    ownedBadge: {
        backgroundColor: "#2E7D32",
    },
    heroBadgeText: {
        color: WHITE,
        fontSize: 12,
        fontWeight: "700",
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 21,
        fontWeight: "700",
        color: BLACK,
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    freeText: {
        fontSize: 19,
        fontWeight: "700",
        color: RED,
    },
    discountPrice: {
        fontSize: 19,
        fontWeight: "700",
        color: RED,
        marginRight: 10,
    },
    originalPrice: {
        fontSize: 14,
        color: GREY,
        textDecorationLine: "line-through",
    },
    pendingBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FDECEA",
        borderRadius: 10,
        paddingVertical: 9,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    pendingBannerText: {
        color: RED_DARK,
        fontSize: 12,
        fontWeight: "600",
        marginLeft: 6,
        flex: 1,
    },
    shortDescription: {
        fontSize: 14,
        color: GREY,
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: BORDER,
        marginVertical: 18,
    },
    sectionHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: BLACK,
        marginBottom: 14,
    },
    countPill: {
        backgroundColor: LIGHT_GREY,
        borderRadius: 12,
        paddingVertical: 2,
        paddingHorizontal: 9,
        marginLeft: 8,
        marginBottom: 14,
    },
    countPillText: {
        fontSize: 12,
        fontWeight: "700",
        color: BLACK,
    },
    courseCard: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        marginBottom: 12,
        overflow: "hidden",
        backgroundColor: WHITE,
    },
    courseThumb: {
        width: 92,
        alignSelf: "stretch",
        backgroundColor: LIGHT_GREY,
    },
    courseThumbPlaceholder: {
        backgroundColor: RED,
        alignItems: "center",
        justifyContent: "center",
    },
    courseInfo: {
        flex: 1,
        padding: 10,
    },
    courseTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: BLACK,
        marginBottom: 3,
    },
    courseDesc: {
        fontSize: 12,
        color: GREY,
        marginBottom: 6,
        lineHeight: 16,
    },
    coursePrice: {
        fontSize: 13,
        fontWeight: "700",
        color: RED,
        marginBottom: 8,
    },
    courseActions: {
        flexDirection: "row",
    },
    viewDetailsButton: {
        borderWidth: 1,
        borderColor: RED,
        borderRadius: 8,
        paddingVertical: 7,
        paddingHorizontal: 12,
        marginRight: 8,
    },
    viewDetailsText: {
        color: RED,
        fontSize: 12,
        fontWeight: "700",
    },
    buyButton: {
        backgroundColor: RED,
        borderRadius: 8,
        paddingVertical: 7,
        paddingHorizontal: 16,
    },
    buyButtonText: {
        color: WHITE,
        fontSize: 12,
        fontWeight: "700",
    },
    webViewWrapper: {
        width: "100%",
        borderRadius: 10,
        overflow: "hidden",
    },
    stickyFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: BORDER,
        backgroundColor: WHITE,
    },
    footerPriceRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    footerPrice: {
        fontSize: 18,
        fontWeight: "700",
        color: RED,
        marginRight: 8,
    },
    footerOriginal: {
        fontSize: 13,
        color: GREY,
        textDecorationLine: "line-through",
    },
    footerFree: {
        fontSize: 18,
        fontWeight: "700",
        color: RED,
    },
    footerBuyButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: RED,
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 22,
        minWidth: 140,
    },
    footerOwnedButton: {
        backgroundColor: "#2E7D32",
    },
    footerBuyButtonText: {
        color: WHITE,
        fontWeight: "700",
        fontSize: 14,
        marginRight: 6,
    },
    centerFill: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: WHITE,
        paddingHorizontal: 24,
    },
    errorText: {
        color: BLACK,
        fontSize: 14,
        textAlign: "center",
        marginTop: 10,
        marginBottom: 14,
    },
    retryButton: {
        backgroundColor: RED,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    retryButtonText: {
        color: WHITE,
        fontWeight: "700",
    },
});
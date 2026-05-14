import React, { useEffect, useRef, useState } from "react";
import {
    View, Text, StatusBar, ScrollView,
    TouchableOpacity, StyleSheet, Animated, Image, Linking,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { COLORS } from "../../utils/dummyData";
import useAuthStore from "../../store/useAuthStore";
import { Loader, AuthWarn } from "../../components/LoadingAndAuthWarn";
import API from "../../utils/axiosInstanct";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
        weekday: "long", year: "numeric",
        month: "long", day: "numeric",
    });
}

function formatTime(timeStr) {
    if (!timeStr) return "—";
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const display = hour % 12 === 0 ? 12 : hour % 12;
    return `${display}:${m} ${ampm}`;
}

function capitalize(str = "") {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── sub-components ───────────────────────────────────────────────────────────

function InfoRow({ icon, label, value, valueColor }) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
                <Ionicons name={icon} size={15} color={COLORS.primary} />
            </View>
            <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]}>
                    {value}
                </Text>
            </View>
        </View>
    );
}

function Divider() {
    return <View style={styles.divider} />;
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function BookingSuccess({ route, navigation }) {
    const { orderId } = route.params;
    const [bookingDetails, setBookingDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();

    // animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.6)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const cardAnim = useRef(new Animated.Value(70)).current;

    useEffect(() => {
        const fetchBookingDetails = async () => {
            try {
                const response = await API.get(`/extra/mentors-booking/details/${orderId}`);
                console.log("Booking details", response.data);
                setBookingDetails(response.data.data);
            } catch (e) {
                console.log(e);
            } finally {
                setLoading(false);
            }
        };
        fetchBookingDetails();
    }, [orderId]);

    // entrance animation fires once data arrives
    useEffect(() => {
        if (!bookingDetails) return;
        Animated.sequence([
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
                Animated.timing(cardAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
            ]),
        ]).start();
    }, [bookingDetails]);

    const handleGoHome = () => {
        navigation.popToTop();
        navigation.replace("Home");
    };

    const handleJoinZoom = () => {
        if (bookingDetails?.zoom_join_url) {
            Linking.openURL(bookingDetails.zoom_join_url);
        }
    };

    // ── guards
    if (loading) return <Loader />;
    if (!bookingDetails) return <AuthWarn message="Unable to fetch booking details." />;

    const d = bookingDetails;
    const discount = parseFloat(d.price) - parseFloat(d.final_price);

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* ════════ HERO ════════ */}
                <LinearGradient
                    colors={[COLORS.primaryDark, COLORS.gradient1, "#1a1a1a"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    {/* decorative blobs */}
                    <View style={styles.blob1} />
                    <View style={styles.blob2} />

                    <SafeAreaView edges={["top"]} style={styles.heroInner}>

                        {/* animated checkmark */}
                        <Animated.View style={[
                            styles.checkWrap,
                            { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
                        ]}>
                            <View style={styles.checkRing}>
                                <View style={styles.checkCircle}>
                                    <Ionicons name="checkmark" size={38} color={COLORS.white} />
                                </View>
                            </View>
                        </Animated.View>

                        {/* headline */}
                        <Animated.View style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                            alignItems: "center",
                        }}>
                            <Text style={styles.heroTitle}>Booking Confirmed!</Text>
                            <Text style={styles.heroSub}>
                                Your mentoring session is all set.{"\n"}Get ready to level up.
                            </Text>
                        </Animated.View>

                        {/* mentor pill */}
                        <Animated.View style={[
                            styles.mentorPill,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                        ]}>
                            {d.mentor_photo ? (
                                <Image source={{ uri: d.mentor_photo }} style={styles.mentorAvatar} />
                            ) : (
                                <View style={[styles.mentorAvatar, styles.mentorAvatarFallback]}>
                                    <Text style={styles.mentorAvatarLetter}>
                                        {d.mentor_name?.[0] ?? "M"}
                                    </Text>
                                </View>
                            )}
                            <View style={{ marginLeft: 10 }}>
                                <Text style={styles.mentorPillWith}>Session with</Text>
                                <Text style={styles.mentorPillName}>{d.mentor_name}</Text>
                            </View>
                        </Animated.View>

                    </SafeAreaView>
                </LinearGradient>

                {/* ════════ CARDS ════════ */}
                <Animated.View style={[
                    styles.cardsWrap,
                    { opacity: fadeAnim, transform: [{ translateY: cardAnim }] },
                ]}>

                    {/* Session Details */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Session Details</Text>
                        <Divider />
                        <InfoRow icon="calendar-outline" label="Date" value={formatDate(d.session_date)} />
                        <InfoRow icon="time-outline" label="Time" value={`${formatTime(d.start_time)} – ${formatTime(d.end_time)}`} />
                        <InfoRow icon="hourglass-outline" label="Duration" value={`${d.duration_minutes} minutes`} />
                        <InfoRow icon="videocam-outline" label="Platform" value={capitalize(d.meeting_platform)} />
                        <InfoRow
                            icon="shield-checkmark-outline"
                            label="Status"
                            value={capitalize(d.status)}
                            valueColor={COLORS.success}
                        />
                    </View>

                    {/* Payment Summary */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Payment Summary</Text>
                        <Divider />

                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Original price</Text>
                            <Text style={styles.priceStrike}>₹{parseFloat(d.price).toFixed(0)}</Text>
                        </View>
                        {discount > 0 && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Discount</Text>
                                <Text style={styles.priceDiscount}>– ₹{discount.toFixed(0)}</Text>
                            </View>
                        )}
                        <Divider />
                        <View style={styles.priceRow}>
                            <Text style={styles.priceTotalLabel}>Amount Paid</Text>
                            <Text style={styles.priceTotalValue}>₹{parseFloat(d.final_price).toFixed(0)}</Text>
                        </View>

                        <View style={styles.txnRow}>
                            <Ionicons name="receipt-outline" size={13} color={COLORS.textLight} />
                            <Text style={styles.txnText} numberOfLines={1}>
                                {"  "}Txn: {d.transaction_id}
                            </Text>
                        </View>

                        <View style={[
                            styles.payBadge,
                            d.payment_status === "success"
                                ? { backgroundColor: "#ECFDF5" }
                                : { backgroundColor: COLORS.primaryLight },
                        ]}>
                            <Ionicons
                                name={d.payment_status === "success" ? "checkmark-circle" : "time"}
                                size={14}
                                color={d.payment_status === "success" ? COLORS.success : COLORS.warning}
                            />
                            <Text style={[
                                styles.payBadgeText,
                                { color: d.payment_status === "success" ? COLORS.success : COLORS.warning },
                            ]}>
                                {"  "}Payment {capitalize(d.payment_status)}
                            </Text>
                        </View>
                    </View>

                    {/* Zoom Info */}
                    {d.zoom_meeting_id ? (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Join Info</Text>
                            <Divider />
                            <InfoRow icon="link-outline" label="Meeting ID" value={d.zoom_meeting_id} />
                            <InfoRow icon="lock-closed-outline" label="Password" value={d.zoom_password} />

                            <TouchableOpacity
                                style={styles.zoomBtn}
                                onPress={handleJoinZoom}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={["#2D8CFF", "#0E5FCC"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.zoomBtnGrad}
                                >
                                    <Ionicons name="videocam" size={18} color={COLORS.white} />
                                    <Text style={styles.zoomBtnText}>Join on Zoom</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ) : null}

                </Animated.View>

                {/* ════════ FOOTER ACTIONS ════════ */}
                <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                    <TouchableOpacity style={styles.homeBtn} onPress={handleGoHome} activeOpacity={0.85}>
                        <LinearGradient
                            colors={[COLORS.gradient1, COLORS.gradient2]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.homeBtnGrad}
                        >
                            <Ionicons name="home-outline" size={18} color={COLORS.white} />
                            <Text style={styles.homeBtnText}>Back to Home</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    
                </Animated.View>

            </ScrollView>
        </View>
    );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#F2F2F2",
    },
    scrollContent: {
        paddingBottom: 48,
    },

    // Hero
    hero: {
        paddingBottom: 52,
    },
    heroInner: {
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 16,
    },
    blob1: {
        position: "absolute",
        width: 220, height: 220,
        borderRadius: 110,
        backgroundColor: "rgba(255,255,255,0.05)",
        top: -60, right: -60,
    },
    blob2: {
        position: "absolute",
        width: 160, height: 160,
        borderRadius: 80,
        backgroundColor: "rgba(255,255,255,0.04)",
        bottom: 20, left: -50,
    },

    // checkmark
    checkWrap: {
        marginTop: 8,
        marginBottom: 4,
    },
    checkRing: {
        width: 90, height: 90,
        borderRadius: 45,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.25)",
        alignItems: "center",
        justifyContent: "center",
    },
    checkCircle: {
        width: 70, height: 70,
        borderRadius: 35,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },

    // hero text
    heroTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: 0.3,
        textAlign: "center",
    },
    heroSub: {
        fontSize: 14,
        color: "rgba(255,255,255,0.70)",
        textAlign: "center",
        lineHeight: 21,
        marginTop: 4,
    },

    // mentor pill
    mentorPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.13)",
        borderRadius: 50,
        paddingVertical: 8,
        paddingHorizontal: 14,
        marginTop: 4,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
    },
    mentorAvatar: {
        width: 40, height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.5)",
    },
    mentorAvatarFallback: {
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    mentorAvatarLetter: {
        fontSize: 16, fontWeight: "700", color: "#FFFFFF",
    },
    mentorPillWith: {
        fontSize: 11,
        color: "rgba(255,255,255,0.65)",
        fontWeight: "500",
    },
    mentorPillName: {
        fontSize: 15, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.2,
    },

    // cards
    cardsWrap: {
        paddingHorizontal: 18,
        marginTop: -26,
        gap: 14,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 11,
        fontWeight: "700",
        color: "#9CA3AF",
        letterSpacing: 1.2,
        textTransform: "uppercase",
        marginBottom: 10,
    },
    divider: {
        height: 1,
        backgroundColor: "#F0F0F0",
        marginVertical: 8,
    },

    // info rows
    infoRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 7,
    },
    infoIconWrap: {
        width: 30, height: 30,
        borderRadius: 8,
        backgroundColor: "#FFF0F0",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        marginTop: 1,
    },
    infoTextWrap: { flex: 1 },
    infoLabel: {
        fontSize: 11,
        color: "#9CA3AF",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14, fontWeight: "600", color: "#111111",
    },

    // price
    priceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 5,
    },
    priceLabel: { fontSize: 14, color: "#555555" },
    priceStrike: { fontSize: 14, color: "#9CA3AF", textDecorationLine: "line-through" },
    priceDiscount: { fontSize: 14, color: "#10B981", fontWeight: "600" },
    priceTotalLabel: { fontSize: 15, fontWeight: "700", color: "#000000" },
    priceTotalValue: { fontSize: 18, fontWeight: "800", color: "#E53935" },

    txnRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
    },
    txnText: { fontSize: 11, color: "#9CA3AF", flex: 1 },

    payBadge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginTop: 10,
    },
    payBadgeText: { fontSize: 12, fontWeight: "700" },

    // zoom button
    zoomBtn: { marginTop: 14, borderRadius: 12, overflow: "hidden" },
    zoomBtnGrad: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 13,
        gap: 8,
    },
    zoomBtnText: {
        fontSize: 15, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3,
    },

    // footer
    footer: {
        paddingHorizontal: 18,
        paddingTop: 8,
        gap: 10,
    },
    homeBtn: { borderRadius: 14, overflow: "hidden", marginTop: 14 },
    homeBtnGrad: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 15,
        gap: 8,
    },
    homeBtnText: {
        fontSize: 16, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3,
    },
    ghostBtn: {
        alignItems: "center",
        paddingVertical: 13,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: "#E53935",
    },
    ghostBtnText: {
        fontSize: 15, fontWeight: "700", color: "#E53935", letterSpacing: 0.2,
    },
});
import React, { useEffect, useState } from "react";
import {
    View, Text, StatusBar, ScrollView,
    TouchableOpacity, StyleSheet, ActivityIndicator, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { CFPaymentGatewayService } from "react-native-cashfree-pg-sdk";
import {
    CFEnvironment, CFSession, CFThemeBuilder, CFDropCheckoutPayment,
} from "cashfree-pg-api-contract";

import { COLORS } from "../../utils/dummyData";
import useAuthStore from "../../store/useAuthStore";
import { Loader, AuthWarn } from "../../components/LoadingAndAuthWarn";
import API from "../../utils/axiosInstanct";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SESSION_ICON = { video: "videocam-outline", chat: "chatbubble-outline", call: "call-outline" };
const PLATFORM_LABEL = { google_meet: "Google Meet", zoom: "Zoom", custom: "Custom" };

function Avatar({ uri, size = 50 }) {
    const [failed, setFailed] = useState(false);
    const r = size / 2;
    if (!uri || failed) {
        return (
            <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: r }]}>
                <Ionicons name="person" size={size * 0.44} color="#A5B4FC" />
            </View>
        );
    }
    return (
        <Image
            source={{ uri }}
            style={{ width: size, height: size, borderRadius: r, backgroundColor: "#EEF2FF" }}
            onError={() => setFailed(true)}
        />
    );
}

// Generate next 14 days
function generateDates() {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const result = [];
    const today = new Date();
    for (let i = 0; i < 10; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        result.push({
            label: String(d.getDate()).padStart(2, "0"),
            day: days[d.getDay()],
            month: months[d.getMonth()],
            value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
            isToday: i === 0,
        });
    }
    return result;
}

const DATE_LIST = generateDates();

export default function BookSessionWithMentor({ route, navigation }) {
    const { mentor, available_prices: plan } = route.params;
    const { user } = useAuthStore();

    const [selectedDate, setSelectedDate] = useState(null);
    // slot = { start_time, end_time, label }
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [booking, setBooking] = useState(false);

    useEffect(() => {
        if (!selectedDate) return;
        fetchSlots();
    }, [selectedDate]);

    const fetchSlots = async () => {
        try {
            setSlotsLoading(true);
            setSelectedSlot(null);
            const res = await API.get(
                `/extra/mentors/${mentor.id}/slots?date=${selectedDate}&session_price_id=${plan.id}`
            );
            setSlots(res.data.slots || []);
        } catch (e) {
            console.log(e);
            setSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    // In useEffect on mount — set callback once
    useEffect(() => {
        CFPaymentGatewayService.setCallback({
            onVerify: async (orderId) => {
                try {
                    await API.get(`/extra/mentors-booking/verify?order_id=${orderId}`);
                    fetchSlots()
                    navigation.replace("BookingSuccess", { orderId });
                } catch (e) { console.log(e); }
            },


            onError: (error, orderId) => {
                console.log("Payment error", error, orderId);
            },
        });

        return () => CFPaymentGatewayService.removeCallback(); // cleanup on unmount
    }, []);


    const handleBook = async () => {
        if (!selectedDate || !selectedSlot) return;
        try {
            setBooking(true);

            const res = await API.post("/extra/mentors/book-session", {
                mentor_id: mentor.id,
                session_price_id: plan.id,
                session_date: selectedDate,
                start_time: selectedSlot.start_time,
            });

            const { order_id, payment_session_id } = res.data.data;

            const session = new CFSession(
                payment_session_id,
                order_id,
                CFEnvironment.SANDBOX
            );

            const theme = new CFThemeBuilder()
                .setNavigationBarBackgroundColor(COLORS.primary)
                .setNavigationBarTextColor("#FFFFFF")
                .setButtonBackgroundColor(COLORS.primary)
                .setButtonTextColor("#FFFFFF")
                .setPrimaryTextColor("#0F172A")
                .setSecondaryTextColor("#64748B")
                .build();

            // ✅ null — not [] — means show all payment modes
            const dropPayment = new CFDropCheckoutPayment(session, null, theme);

            CFPaymentGatewayService.doPayment(dropPayment);

        } catch (e) {
            console.log(e.response?.data.message || e);
        } finally {
            setBooking(false);
        }
    };

    if (!user) return <AuthWarn />;

    const canBook = selectedDate && selectedSlot;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <LinearGradient
                colors={["#a33030", "#e54646", "#f16363"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.decoA} />
                <View style={styles.decoB} />

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                    <Avatar uri={mentor.profile_photo} size={48} />
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>Book a Session</Text>
                        <Text style={styles.headerSub}>with {mentor.name}</Text>
                    </View>
                </View>

                {/* Plan summary strip */}
                <View style={styles.planStrip}>
                    <View style={styles.planStripLeft}>
                        <Ionicons
                            name={SESSION_ICON[plan.session_type] || "calendar-outline"}
                            size={14} color="#FCD34D"
                        />
                        <Text style={styles.planStripText}>
                            {plan.duration_minutes} min · {plan.session_type} · {PLATFORM_LABEL[plan.meeting_platform] || plan.meeting_platform}
                        </Text>
                    </View>
                    <Text style={styles.planStripPrice}>₹{plan.discount_price || plan.price}</Text>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* ── Date Picker ────────────────────────────────────────────────── */}
                <Text style={styles.sectionTitle}>Select Date</Text>
                <View style={styles.datesWrap}>
                    {DATE_LIST.map((d) => {
                        const active = selectedDate === d.value;
                        return (
                            <TouchableOpacity
                                key={d.value}
                                onPress={() => setSelectedDate(d.value)}
                                activeOpacity={0.8}
                                style={[styles.dateCard, active && styles.dateCardActive]}
                            >
                                <Text style={[styles.dateDayText, active && styles.white]}>{d.day}</Text>
                                <Text style={[styles.dateNumText, active && styles.white]}>{d.label}</Text>
                                <Text style={[styles.dateMonText, active && styles.whiteFaint]}>{d.month}</Text>
                                {d.isToday && !active && <View style={styles.todayDot} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ── Time Slots ─────────────────────────────────────────────────── */}
                {selectedDate && (
                    <View style={{ marginTop: 24 }}>
                        <Text style={styles.sectionTitle}>Select Time Slot</Text>

                        {slotsLoading ? (
                            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 16 }} />
                        ) : slots.length === 0 ? (
                            <View style={styles.emptySlots}>
                                <View style={styles.emptySlotsIcon}>
                                    <Ionicons name="time-outline" size={32} color="#C7D2FE" />
                                </View>
                                <Text style={styles.emptySlotsTitle}>No slots available</Text>
                                <Text style={styles.emptySlotsSubTitle}>Try a different date</Text>
                            </View>
                        ) : (
                            <View style={styles.slotsWrap}>
                                {slots.map((slot, i) => {
                                    const active = selectedSlot?.start_time === slot.start_time;
                                    return (
                                        <TouchableOpacity
                                            key={i}
                                            onPress={() => setSelectedSlot(slot)}
                                            activeOpacity={0.8}
                                            style={[styles.slotChip, active && styles.slotChipActive]}
                                        >
                                            <Ionicons
                                                name="time-outline" size={12}
                                                color={active ? "#fff" : COLORS.primary}
                                            />
                                            {/* Show readable label e.g. "10:00 AM - 10:30 AM" */}
                                            <Text style={[styles.slotText, active && styles.slotTextActive]}>
                                                {slot.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}

                {/* ── Booking Summary ────────────────────────────────────────────── */}
                {canBook && (
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <Ionicons name="receipt-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.summaryTitle}>Booking Summary</Text>
                        </View>
                        {[
                            { icon: "person-outline", label: "Mentor", val: mentor.name },
                            { icon: "calendar-outline", label: "Date", val: selectedDate },
                            { icon: "time-outline", label: "Time", val: selectedSlot.label },
                            { icon: "videocam-outline", label: "Session", val: `${plan.duration_minutes} min · ${plan.session_type}` },
                            { icon: "globe-outline", label: "Platform", val: PLATFORM_LABEL[plan.meeting_platform] || plan.meeting_platform },
                            { icon: "pricetag-outline", label: "Amount", val: `₹${plan.discount_price || plan.price}` },
                        ].map((row, i, arr) => (
                            <View
                                key={i}
                                style={[styles.summaryRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}
                            >
                                <View style={styles.summaryIconWrap}>
                                    <Ionicons name={row.icon} size={13} color={COLORS.primary} />
                                </View>
                                <Text style={styles.summaryLabel}>{row.label}</Text>
                                <Text style={styles.summaryVal}>{row.val}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 110 }} />
            </ScrollView>

            {/* ── CTA ────────────────────────────────────────────────────────────── */}
            <View style={styles.ctaWrap}>
                <TouchableOpacity
                    activeOpacity={canBook ? 0.85 : 1}
                    onPress={handleBook}
                    disabled={!canBook || booking}
                    style={[styles.ctaBtn, !canBook && styles.ctaBtnDisabled]}
                >
                    <LinearGradient
                        colors={canBook ? ["#e54646", "#f16365"] : ["#CBD5E1", "#CBD5E1"]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.ctaGradient}
                    >
                        {booking
                            ? <ActivityIndicator color="#fff" size="small" />
                            : (
                                <>
                                    <Text style={styles.ctaText}>
                                        {canBook
                                            ? `Proceed to Pay · ₹${plan.discount_price || plan.price}`
                                            : "Pick Date & Time First"}
                                    </Text>
                                    {canBook && <Ionicons name="arrow-forward" size={18} color="#fff" />}
                                </>
                            )
                        }
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F6FB" },
    avatarFallback: { backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
    white: { color: "#fff" },
    whiteFaint: { color: "rgba(255,255,255,0.65)" },

    // Header
    header: {
        paddingTop: 14, paddingHorizontal: 18, paddingBottom: 18, overflow: "hidden",
    },
    decoA: {
        position: "absolute", width: 180, height: 180, borderRadius: 90,
        backgroundColor: "rgba(255,255,255,0.07)", top: -50, right: -40,
    },
    decoB: {
        position: "absolute", width: 80, height: 80, borderRadius: 40,
        backgroundColor: "rgba(255,255,255,0.07)", bottom: 0, right: 70,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center", justifyContent: "center", marginBottom: 14,
    },
    headerContent: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
    headerInfo: {},
    headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
    headerSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
    planStrip: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        backgroundColor: "rgba(255,255,255,0.13)",
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    },
    planStripLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
    planStripText: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600" },
    planStripPrice: { fontSize: 16, fontWeight: "800", color: "#FCD34D" },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 18, paddingTop: 22 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 12 },

    // Dates
    datesWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    dateCard: {
        width: 54, alignItems: "center",
        backgroundColor: "#fff", borderRadius: 14, paddingVertical: 10,
        borderWidth: 1.5, borderColor: "#EEF1F8",
    },
    dateCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    dateDayText: { fontSize: 10, fontWeight: "600", color: "#94A3B8" },
    dateNumText: { fontSize: 17, fontWeight: "800", color: "#0F172A", marginVertical: 2 },
    dateMonText: { fontSize: 10, fontWeight: "500", color: "#94A3B8" },
    todayDot: {
        width: 5, height: 5, borderRadius: 3,
        backgroundColor: COLORS.primary, marginTop: 3,
    },

    // Slots
    slotsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
    slotChip: {
        flexDirection: "row", alignItems: "center", gap: 5,
        paddingHorizontal: 16, paddingVertical: 12,
        borderRadius: 10, backgroundColor: "#fff",
        borderWidth: 1.5, borderColor: "#EEF1F8",
    },
    slotChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    slotText: { fontSize: 9, fontWeight: "600", color: "#0F172A" },
    slotTextActive: { color: "#fff" },

    // Empty
    emptySlots: { alignItems: "center", paddingVertical: 28 },
    emptySlotsIcon: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: "#EEF2FF", alignItems: "center",
        justifyContent: "center", marginBottom: 10,
    },
    emptySlotsTitle: { fontSize: 14, fontWeight: "700", color: "#94A3B8" },
    emptySlotsSubTitle: { fontSize: 12, color: "#CBD5E1", marginTop: 3 },

    // Summary
    summaryCard: {
        backgroundColor: "#fff", borderRadius: 18,
        padding: 16, marginTop: 24,
        borderWidth: 1.5, borderColor: "#EEF1F8",
    },
    summaryHeader: {
        flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12,
    },
    summaryTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
    summaryRow: {
        flexDirection: "row", alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
    },
    summaryIconWrap: {
        width: 26, height: 26, borderRadius: 7,
        backgroundColor: "#EEF2FF", alignItems: "center",
        justifyContent: "center", marginRight: 10,
    },
    summaryLabel: { flex: 1, fontSize: 12, color: "#94A3B8", fontWeight: "500" },
    summaryVal: { fontSize: 13, fontWeight: "700", color: "#0F172A" },

    // CTA
    ctaWrap: {
        position: "absolute", bottom: 0, left: 0, right: 0,
        paddingHorizontal: 18, paddingBottom: 58, paddingTop: 12,
        backgroundColor: "#F5F6FB",
        borderTopWidth: 1, borderTopColor: "#EEF1F8",
    },
    ctaBtn: { borderRadius: 14, overflow: "hidden" },
    ctaBtnDisabled: { opacity: 0.6 },
    ctaGradient: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "center", paddingVertical: 15, gap: 8,
    },
    ctaText: { fontSize: 15, fontWeight: "800", color: "#fff", letterSpacing: 0.2 },
});
import React, { useEffect, useState } from "react";
import {
    View, Text, StatusBar, ScrollView,
    TouchableOpacity, StyleSheet, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "react-native";

import { COLORS } from "../../utils/dummyData";
import useAuthStore from "../../store/useAuthStore";
import { Loader, AuthWarn } from "../../components/LoadingAndAuthWarn";
import API from "../../utils/axiosInstanct";

// ─── Avatar fallback ─────────────────────────────────────────────────────────
function Avatar({ uri, size = 90 }) {
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

// ─── Session type icon ────────────────────────────────────────────────────────
const SESSION_ICON = { video: "videocam-outline", chat: "chatbubble-outline", call: "call-outline" };
const PLATFORM_LABEL = { google_meet: "Google Meet", zoom: "Zoom", custom: "Custom" };

export default function MentorDetails({ route, navigation }) {
    const { id } = route.params;
    const { user } = useAuthStore();
    const [mentor, setMentor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectPrice, setSelectPrice] = useState(null);

    const fetchMentor = async () => {
        try {
            const res = await API.get(`/extra/mentors/${id}`);
            setMentor(res.data.data);
        } catch (e) { console.log(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchMentor(); }, []);

    if (!user) return <AuthWarn />;
    if (loading) return <Loader />;
    if (!mentor) return null;

    const skills = mentor.skills?.split(",").map((s) => s.trim()) || [];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Back button over gradient */}
            <LinearGradient
                colors={["#a33030", "#e54646", "#f16363"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.heroBg}
            >
                <View style={styles.decoA} />
                <View style={styles.decoB} />

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>

                {/* Avatar overlapping bottom of gradient */}
                <View style={styles.heroContent}>
                    <View style={styles.avatarRing}>
                        <Avatar uri={mentor.profile_photo} size={88} />
                    </View>
                    <Text style={styles.heroName}>{mentor.name}</Text>
                    <View style={styles.heroBadgeRow}>
                        <View style={styles.heroBadge}>
                            <Ionicons name="bookmark-outline" size={11} color="#FCD34D" />
                            <Text style={styles.heroBadgeText}>{mentor.category_name}</Text>
                        </View>
                        <View style={styles.heroBadge}>
                            <Ionicons name="briefcase-outline" size={11} color="#FCD34D" />
                            <Text style={styles.heroBadgeText}>{mentor.experience} Exp</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Short bio */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.bioText}>{mentor.bio || mentor.shortbio}</Text>
                </View>

                {/* Location */}
                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.infoText}>{mentor.city}, {mentor.state}</Text>
                </View>

                {/* Skills */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Skills</Text>
                    <View style={styles.skillsWrap}>
                        {skills.map((sk, i) => (
                            <View key={i} style={styles.skillPill}>
                                <Text style={styles.skillText}>{sk}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Session Plans */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Choose a Session Plan</Text>
                    {mentor.available_prices?.map((plan) => {
                        const active = selectPrice?.id === plan.id;
                        const discount = plan.discount_price && plan.discount_price < plan.price;
                        return (
                            <TouchableOpacity
                                key={plan.id}
                                activeOpacity={0.8}
                                onPress={() => setSelectPrice(plan)}
                                style={[styles.planCard, active && styles.planCardActive]}
                            >
                                {active && <View style={styles.planBar} />}
                                <View style={styles.planInner}>
                                    {/* Left: icon + info */}
                                    <View style={styles.planIconWrap}>
                                        <Ionicons
                                            name={SESSION_ICON[plan.session_type] || "calendar-outline"}
                                            size={20}
                                            color={active ? "#fff" : COLORS.primary}
                                        />
                                    </View>
                                    <View style={styles.planBody}>
                                        <Text style={[styles.planDuration, active && styles.planTextWhite]}>
                                            {plan.duration_minutes} min · {plan.session_type}
                                        </Text>
                                        <Text style={[styles.planPlatform, active && { color: "rgba(255,255,255,0.7)" }]}>
                                            via {PLATFORM_LABEL[plan.meeting_platform] || plan.meeting_platform}
                                        </Text>
                                    </View>
                                    {/* Right: price */}
                                    <View style={styles.planPriceCol}>
                                        {discount && (
                                            <Text style={[styles.planOrigPrice, active && { color: "rgba(255,255,255,0.5)" }]}>
                                                ₹{plan.price}
                                            </Text>
                                        )}
                                        <Text style={[styles.planPrice, active && styles.planTextWhite]}>
                                            ₹{plan.discount_price || plan.price}
                                        </Text>
                                    </View>
                                    {active && (
                                        <View style={styles.checkBadge}>
                                            <Ionicons name="checkmark" size={13} color={COLORS.primary} />
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Book CTA */}
            <View style={styles.ctaWrap}>
                <TouchableOpacity
                    activeOpacity={selectPrice ? 0.85 : 1}
                    onPress={() => {
                        if (!selectPrice) return;
                        navigation.navigate("BookSessionWithMentor", {
                            mentor,
                            available_prices: selectPrice,
                        });
                    }}
                    style={[styles.ctaBtn, !selectPrice && styles.ctaBtnDisabled]}
                >
                    <LinearGradient
                        colors={selectPrice ? ["#4F46E5", "#6366F1"] : ["#CBD5E1", "#CBD5E1"]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.ctaGradient}
                    >
                        <Text style={styles.ctaText}>
                            {selectPrice ? `Book Session · ₹${selectPrice.discount_price || selectPrice.price}` : "Select a Plan"}
                        </Text>
                        {selectPrice && <Ionicons name="arrow-forward" size={18} color="#fff" />}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F6FB" },

    // Hero
    heroBg: {
        paddingBottom: 30,
        paddingTop: 14,
        paddingHorizontal: 20,
        overflow: "hidden",
    },
    decoA: {
        position: "absolute", width: 200, height: 200, borderRadius: 100,
        backgroundColor: "rgba(255,255,255,0.07)", top: -60, right: -50,
    },
    decoB: {
        position: "absolute", width: 90, height: 90, borderRadius: 45,
        backgroundColor: "rgba(255,255,255,0.07)", bottom: 10, right: 80,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center", justifyContent: "center",
        marginBottom: 16,
    },
    heroContent: { alignItems: "center" },
    avatarRing: {
        width: 96, height: 96, borderRadius: 48,
        borderWidth: 3, borderColor: "rgba(255,255,255,0.4)",
        alignItems: "center", justifyContent: "center",
        marginBottom: 10,
    },
    heroName: {
        fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: -0.3,
    },
    heroBadgeRow: { flexDirection: "row", gap: 8, marginTop: 8 },
    heroBadge: {
        flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: "rgba(255,255,255,0.14)",
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    heroBadgeText: { color: "#FCD34D", fontSize: 11, fontWeight: "700" },

    // Avatar fallback
    avatarFallback: { backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 18, paddingTop: 20 },

    // Sections
    section: { marginBottom: 22 },
    sectionTitle: {
        fontSize: 15, fontWeight: "700", color: "#0F172A",
        marginBottom: 10,
    },
    bioText: { fontSize: 13, color: "#64748B", lineHeight: 20 },
    infoRow: {
        flexDirection: "row", alignItems: "center", gap: 5,
        marginBottom: 18,
    },
    infoText: { fontSize: 13, color: "#64748B" },

    // Skills
    skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    skillPill: {
        backgroundColor: "#EEF2FF", borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 5,
        borderWidth: 1, borderColor: "#C7D2FE",
    },
    skillText: { fontSize: 12, fontWeight: "600", color: COLORS.primary },

    // Plan cards
    planCard: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 16,
        marginBottom: 10,
        overflow: "hidden",
        borderWidth: 1.5,
        borderColor: "#EEF1F8",
    },
    planCardActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    planBar: {
        width: 4, backgroundColor: "#FCD34D",
    },
    planInner: {
        flex: 1, flexDirection: "row",
        alignItems: "center", padding: 14, gap: 10,
    },
    planIconWrap: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.18)",
        alignItems: "center", justifyContent: "center",
    },
    planBody: { flex: 1 },
    planDuration: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
    planPlatform: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
    planTextWhite: { color: "#fff" },
    planPriceCol: { alignItems: "flex-end" },
    planOrigPrice: {
        fontSize: 11, color: "#94A3B8",
        textDecorationLine: "line-through",
    },
    planPrice: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
    checkBadge: {
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: "#fff",
        alignItems: "center", justifyContent: "center",
        marginLeft: 4,
    },

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
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        paddingVertical: 15, gap: 8,
    },
    ctaText: { fontSize: 15, fontWeight: "800", color: "#fff", letterSpacing: 0.2 },
});
import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    StatusBar,
    Switch,
    ActivityIndicator,
    Linking,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";

import { COLORS } from "../../utils/dummyData";
import useAuthStore from "../../store/useAuthStore";
import { AuthWarn, Loader } from "../../components/LoadingAndAuthWarn";
import { useFocusEffect } from "@react-navigation/native";

const MENU_SECTIONS = [
    {
        title: "Learning Hub",
        items: [
            {
                icon: "library-outline",
                label: "Enrolled Courses",
                color: "#6366F1",
                route: "AllMyCourses",
            },
            {
                icon: "people-outline",
                label: "Mentor Sessions",
                color: "#8B5CF6",
                route: "AllMentorsBookings",
            },
            {
                icon: "briefcase-outline",
                label: "Applied Opportunities",
                color: "#10B981",
                route: "applications",
            },
            {
                icon: "person-circle-outline",
                label: "My Profile",
                color: "#0EA5E9",
                route: "Profile",
            },
        ],
    },

    {
        title: "Security & Payments",
        items: [
            {
                icon: "card-outline",
                label: "Payments & Billing",
                color: "#F59E0B",
                route: "Payments",
            },
            {
                icon: "notifications-outline",
                label: "Notifications",
                color: "#EC4899",
                route: "Notifications",
                badge: "3",
            },
        ],
    },

    {
        title: "Others",
        items: [
            {
                icon: "help-circle-outline",
                label: "Help & Support",
                color: "#14B8A6",
                link: "https://efos.in/contact-us",
            },
            {
                icon: "information-circle-outline",
                label: "About EFOS",
                color: "#3B82F6",
                link: "https://efos.in/our-story",
            },
        ],
    },
];

export function ProfileScreen({ navigation }) {

    const insets = useSafeAreaInsets();
    const {
        user,
        student,
        isLoading,
        isAuthenticated,
        logout,
        stats,
        fetchProfile,
    } = useAuthStore();
    console.log(student)

    const [loggingOut, setLoggingOut] = useState(false);

    const [biometricEnabled, setBiometricEnabled] =
        useState(false);

    const [checkingBio, setCheckingBio] =
        useState(false);

    // =========================
    // FETCH PROFILE
    // =========================

    useFocusEffect(
        useCallback(() => {
            fetchProfile();

            return () => {
                // Optional cleanup
            };
        }, [])
    );

    // =========================
    // BIOMETRIC ENABLE
    // =========================

    const handleBiometricToggle = async () => {

        try {

            setCheckingBio(true);

            const compatible =
                await LocalAuthentication.hasHardwareAsync();

            if (!compatible) {

                Alert.alert(
                    "Not Supported",
                    "Biometric authentication is not supported on this device."
                );

                return;
            }

            const enrolled =
                await LocalAuthentication.isEnrolledAsync();

            if (!enrolled) {

                Alert.alert(
                    "No Biometrics Found",
                    "Please setup Face ID or Fingerprint in your device settings."
                );

                return;
            }

            const result =
                await LocalAuthentication.authenticateAsync({
                    promptMessage: biometricEnabled
                        ? "Disable Biometric Lock"
                        : "Enable Biometric Lock",
                    fallbackLabel: "Use Passcode",
                    cancelLabel: "Cancel",
                    disableDeviceFallback: false,
                });

            if (result.success) {

                setBiometricEnabled(!biometricEnabled);

                Alert.alert(
                    "Success",
                    biometricEnabled
                        ? "Biometric lock disabled successfully."
                        : "Biometric lock enabled successfully."
                );
            }

        } catch (error) {

            console.log("Biometric Error:", error);

            Alert.alert(
                "Error",
                "Something went wrong with biometric authentication."
            );

        } finally {

            setCheckingBio(false);
        }
    };

    // =========================
    // LOGOUT
    // =========================

    const handleLogout = () => {

        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },

                {
                    text: "Sign Out",
                    style: "destructive",

                    onPress: async () => {

                        setLoggingOut(true);

                        try {

                            await logout();

                            navigation.replace("Login");

                        } catch {

                            navigation.replace("Login");

                        } finally {

                            setLoggingOut(false);
                        }
                    },
                },
            ]
        );
    };

    // =========================
    // LOADING
    // =========================

    if (isLoading) {

        return (
            <Loader message="Loading profile..." />
        );
    }

    // =========================
    // AUTH CHECK
    // =========================

    if (!isAuthenticated) {

        return (
            <AuthWarn
                title="Session Expired"
                message="Please login again to continue."
                onLoginPress={() =>
                    navigation.navigate("Login")
                }
            />
        );
    }

    const avatarUri = student?.photo ? `https://api.epinfoways.com/${student?.photo}` :
        user?.avatarUrl?.replace("/svg", "/png") ||
        "https://i.pravatar.cc/150?img=3";

    const initials = user?.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "?";

    const STAT_DATA = [
        {
            icon: "book-outline",
            value: stats?.total_courses || "0",
            label: "Courses",
            color: "#6366F1",
        },
        {
            icon: "checkbox-outline",
            value: stats?.total_tests || "0",
            label: "Tests",
            color: "#10B981",
        },
        {
            icon: "ribbon-outline",
            value: stats?.total_certificates || "0",
            label: "Certificates",
            color: "#F59E0B",
        },
        {
            icon: "flame-outline",
            value: stats?.total_apply || "0",
            label: "Applied",
            color: COLORS.primary,
        },
    ];

    return (
        <SafeAreaView style={styles.safe}>

            <StatusBar
                barStyle="light-content"
                backgroundColor={COLORS.primary}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: insets.bottom + 30,
                }}
            >

                {/* HERO */}

                <LinearGradient
                    colors={[
                        COLORS.primary,
                        COLORS.primaryDark || "#1E3A8A",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >

                    <View style={styles.heroTop}>

                        <Text style={styles.heroTitle}>
                            My Account
                        </Text>

                        <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() =>
                                navigation.navigate("ResumeBuilder")
                            }
                        >

                            <Ionicons
                                name="create-outline"
                                size={14}
                                color={COLORS.primary}
                            />

                            <Text style={styles.editBtnText}>
                                Edit
                            </Text>

                        </TouchableOpacity>

                    </View>

                    {/* PROFILE */}

                    <View style={styles.profileRow}>

                        <View style={styles.avatarWrap}>

                            {user?.avatarUrl ? (

                                <Image
                                    source={{ uri: avatarUri }}
                                    style={styles.avatar}
                                />

                            ) : (

                                <View style={styles.avatarFallback}>

                                    <Text style={styles.avatarInitials}>
                                        {initials}
                                    </Text>

                                </View>
                            )}

                        </View>

                        <View style={styles.profileInfo}>

                            <Text
                                style={styles.profileName}
                                numberOfLines={1}
                            >
                                {user?.name || "Student"}
                            </Text>

                            <Text
                                style={styles.profileEmail}
                                numberOfLines={1}
                            >
                                {user?.email || "—"}
                            </Text>

                            {user?.registration_number && (
                                <Text style={styles.profileReg}>
                                    #{user.registration_number}
                                </Text>
                            )}

                            <View style={styles.rolePill}>

                                <View style={styles.roleDot} />

                                <Text style={styles.rolePillText}>
                                    {user?.role || "Student"}
                                </Text>

                            </View>

                        </View>

                    </View>

                </LinearGradient>

                {/* STATS */}

                <View style={styles.statsRow}>

                    {STAT_DATA.map((stat) => (

                        <View
                            key={stat.label}
                            style={styles.statCard}
                        >

                            <View
                                style={[
                                    styles.statIconBox,
                                    {
                                        backgroundColor:
                                            stat.color + "15",
                                    },
                                ]}
                            >

                                <Ionicons
                                    name={stat.icon}
                                    size={18}
                                    color={stat.color}
                                />

                            </View>

                            <Text style={styles.statValue}>
                                {stat.value}
                            </Text>

                            <Text style={styles.statLabel}>
                                {stat.label}
                            </Text>

                        </View>
                    ))}

                </View>

                {/* BIOMETRIC */}



                {/* MENU */}

                {MENU_SECTIONS.map((section) => (

                    <View
                        key={section.title}
                        style={styles.section}
                    >

                        <Text style={styles.sectionLabel}>
                            {section.title}
                        </Text>

                        <View style={styles.menuCard}>

                            {section.items.map((item, index) => (

                                <TouchableOpacity
                                    key={item.label}
                                    style={[
                                        styles.menuItem,
                                        index ===
                                        section.items.length - 1 &&
                                        styles.menuItemLast,
                                    ]}
                                    activeOpacity={0.7}
                                    onPress={() => item.link ? Linking.openURL(item.link) : navigation.navigate(item.route)
                                    }
                                >

                                    <View
                                        style={[
                                            styles.menuIconBox,
                                            {
                                                backgroundColor:
                                                    item.color + "15",
                                            },
                                        ]}
                                    >

                                        <Ionicons
                                            name={item.icon}
                                            size={18}
                                            color={item.color}
                                        />

                                    </View>

                                    <Text style={styles.menuLabel}>
                                        {item.label}
                                    </Text>

                                    {item.badge && (

                                        <View style={styles.badge}>

                                            <Text style={styles.badgeText}>
                                                {item.badge}
                                            </Text>

                                        </View>
                                    )}

                                    <Ionicons
                                        name="chevron-forward"
                                        size={15}
                                        color="#9CA3AF"
                                    />

                                </TouchableOpacity>
                            ))}

                        </View>

                    </View>
                ))}

                {/* LOGOUT */}

                <View style={styles.section}>

                    <TouchableOpacity
                        style={styles.logoutBtn}
                        activeOpacity={0.8}
                        disabled={loggingOut}
                        onPress={handleLogout}
                    >

                        <View style={styles.logoutIconBox}>

                            <Ionicons
                                name="log-out-outline"
                                size={18}
                                color="#EF4444"
                            />

                        </View>

                        <Text style={styles.logoutText}>
                            {loggingOut
                                ? "Signing out..."
                                : "Sign Out"}
                        </Text>

                    </TouchableOpacity>

                </View>

                <Text style={styles.version}>
                    EFOS v1.0.0
                </Text>

            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    safe: {
        flex: 1,
        backgroundColor: "#F4F6FA",
    },

    hero: {
        paddingHorizontal: 18,
        paddingTop: 10,
        paddingBottom: 26,
        borderBottomLeftRadius: 26,
        borderBottomRightRadius: 26,
    },

    heroTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 22,
    },

    heroTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#fff",
    },

    editBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        gap: 5,
    },

    editBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.primary,
    },

    profileRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    avatarWrap: {
        marginRight: 16,
    },

    avatar: {
        width: 74,
        height: 74,
        borderRadius: 37,
        borderWidth: 3,
        borderColor: "rgba(255,255,255,0.35)",
    },

    avatarFallback: {
        width: 74,
        height: 74,
        borderRadius: 37,
        backgroundColor: "rgba(255,255,255,0.18)",
        justifyContent: "center",
        alignItems: "center",
    },

    avatarInitials: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "700",
    },

    profileInfo: {
        flex: 1,
    },

    profileName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },

    profileEmail: {
        fontSize: 13,
        color: "rgba(255,255,255,0.75)",
        marginTop: 3,
    },

    profileReg: {
        fontSize: 11,
        color: "rgba(255,255,255,0.6)",
        marginTop: 2,
    },

    rolePill: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginTop: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.15)",
    },

    roleDot: {
        width: 6,
        height: 6,
        borderRadius: 6,
        backgroundColor: "#22C55E",
        marginRight: 6,
    },

    rolePillText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "600",
    },

    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 14,
        marginTop: -18,
        marginBottom: 14,
    },

    statCard: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 16,
        marginHorizontal: 4,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ECECEC",
    },

    statIconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },

    statValue: {
        fontSize: 17,
        fontWeight: "700",
        color: "#111827",
    },

    statLabel: {
        fontSize: 11,
        color: "#6B7280",
        marginTop: 3,
    },

    section: {
        paddingHorizontal: 14,
        marginBottom: 12,
    },

    sectionLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#9CA3AF",
        marginBottom: 8,
        textTransform: "uppercase",
    },

    menuCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#ECECEC",
        overflow: "hidden",
    },

    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },

    menuItemLast: {
        borderBottomWidth: 0,
    },

    menuIconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    menuLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },

    subTitle: {
        fontSize: 11,
        color: "#6B7280",
        marginTop: 2,
    },

    badge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 20,
        marginRight: 8,
    },

    badgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "700",
    },

    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#FECACA",
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },

    logoutIconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#FEF2F2",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    logoutText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#DC2626",
    },

    version: {
        textAlign: "center",
        fontSize: 11,
        color: "#9CA3AF",
        marginTop: 10,
    },
});
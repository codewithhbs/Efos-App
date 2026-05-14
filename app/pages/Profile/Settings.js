import React, { useState } from "react";
import {
    View,
    Text,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function SettingsScreen({ navigation }) {
    const [pushNotification, setPushNotification] =
        useState(true);

    const [whatsappNotification, setWhatsappNotification] =
        useState(false);

    const [emailNotification, setEmailNotification] =
        useState(true);

    const [darkMode, setDarkMode] =
        useState(false);

    const [biometricLock, setBiometricLock] =
        useState(false);

    const SettingRow = ({
        icon,
        title,
        subtitle,
        value,
        onValueChange,
        color = "#DC2626"
    }) => (
        <View style={styles.row}>
            <View
                style={[
                    styles.iconWrap,
                    { backgroundColor: color + "15" }
                ]}
            >
                <Ionicons
                    name={icon}
                    size={20}
                    color={color}
                />
            </View>

            <View style={styles.textWrap}>
                <Text style={styles.title}>
                    {title}
                </Text>
                <Text style={styles.subtitle}>
                    {subtitle}
                </Text>
            </View>

            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{
                    false: "#E5E7EB",
                    true: "#F87171"
                }}
                thumbColor={
                    value ? "#DC2626" : "#fff"
                }
            />
        </View>
    );

    const MenuRow = ({
        icon,
        title,
        onPress,
        color = "#DC2626"
    }) => (
        <TouchableOpacity
            style={styles.row}
            onPress={onPress}
        >
            <View
                style={[
                    styles.iconWrap,
                    { backgroundColor: color + "15" }
                ]}
            >
                <Ionicons
                    name={icon}
                    size={20}
                    color={color}
                />
            </View>

            <View style={styles.textWrap}>
                <Text style={styles.title}>
                    {title}
                </Text>
            </View>

            <Ionicons
                name="chevron-forward"
                size={20}
                color="#9CA3AF"
            />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={"dark-content"} />

            {/* Header */}
            <LinearGradient
                colors={["#991B1B", "#DC2626"]}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>
                    Settings
                </Text>

                <Text style={styles.headerSub}>
                    Manage preferences &
                    notifications
                </Text>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 40
                }}
            >
               

                {/* Privacy */}
                <Text style={styles.section}>
                    Privacy & Security
                </Text>

                <View style={styles.card}>
                    

                    <SettingRow
                        icon="finger-print-outline"
                        title="Biometric Lock"
                        subtitle="Face ID / Fingerprint"
                        value={biometricLock}
                        onValueChange={
                            setBiometricLock
                        }
                        color="#7C3AED"
                    />
                </View>

                {/* Others */}
                <Text style={styles.section}>
                    More
                </Text>

                <View style={styles.card}>
                    


                    <MenuRow
                        icon="help-circle-outline"
                        title="Help & Support"
                        onPress={() =>
                            navigation.navigate("Support")
                        }
                        color="#F59E0B"
                    />

                    <MenuRow
                        icon="log-out-outline"
                        title="Logout"
                        onPress={() =>
                            Alert.alert(
                                "Logout",
                                "Are you sure?"
                            )
                        }
                        color="#DC2626"
                    />
                </View>

                {/* Version */}
                <Text style={styles.version}>
                    App Version 1.0.0
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF7F7"
    },

    header: {
        paddingHorizontal: 18,
        paddingTop: 20,
        paddingBottom: 24
    },

    headerTitle: {
        color: "#fff",
        fontSize: 26,
        fontWeight: "800"
    },

    headerSub: {
        color:
            "rgba(255,255,255,0.85)",
        marginTop: 5
    },

    section: {
        fontSize: 16,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 10,
        marginTop: 8
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 18,
        paddingHorizontal: 14,
        marginBottom: 18,
        elevation: 2
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6"
    },

    iconWrap: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center"
    },

    textWrap: {
        flex: 1,
        marginLeft: 12
    },

    title: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827"
    },

    subtitle: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 3
    },

    version: {
        textAlign: "center",
        marginTop: 10,
        color: "#9CA3AF",
        fontSize: 13
    }
});
import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../utils/dummyData";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.62;

const WORK_MODE_CONFIG = {
  remote: { colors: ["#10B981", "#059669"], icon: "globe-outline" },
  hybrid: { colors: ["#6366F1", "#8B5CF6"], icon: "git-merge-outline" },
  onsite: { colors: ["#F59E0B", "#EF4444"], icon: "business-outline" },
  "on-site": { colors: ["#F59E0B", "#EF4444"], icon: "business-outline" },
};

const getWorkMode = (mode) =>
  WORK_MODE_CONFIG[mode?.toLowerCase()] || {
    colors: [COLORS.primary, COLORS.primary + "CC"],
    icon: "briefcase-outline",
  };

export default function JobCard({ item, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, friction: 6, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();

  const modeConfig = getWorkMode(item.work_mode);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* Gradient top strip */}
        <LinearGradient
          colors={modeConfig.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.strip}
        />

        {/* ── Top: Logo + Title + Company ── */}
        <View style={styles.top}>
          <View style={styles.logoWrap}>
            <Image
              source={{ uri: item.company_logo }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.titleBlock}>
            <Text numberOfLines={1} style={styles.title}>
              {item.title}
            </Text>
            <Text numberOfLines={1} style={styles.company}>
              {item.company_name}
            </Text>

            {/* Work mode badge */}
            <LinearGradient
              colors={modeConfig.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badge}
            >
              <Ionicons name={modeConfig.icon} size={9} color="#fff" />
              <Text style={styles.badgeText}>
                {item.work_mode?.charAt(0).toUpperCase() + item.work_mode?.slice(1)}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* ── Bottom: Salary + Education ── */}
        <View style={styles.bottom}>
          <View style={styles.metaPill}>
            <Ionicons name="cash-outline" size={10} color={modeConfig.colors[0]} />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.salary}
            </Text>
          </View>

          <View style={styles.metaPill}>
            <Ionicons name="school-outline" size={10} color={modeConfig.colors[0]} />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.education}
            </Text>
          </View>
        </View>

        {/* Arrow button */}
        <View style={[styles.arrowBtn, { backgroundColor: modeConfig.colors[0] }]}>
          <Ionicons name="arrow-forward" size={11} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    padding: 13,
    paddingTop: 16,
    marginRight: 12,
    elevation: 4,
    shadowColor: "#6366F1",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  strip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },

  // ── Top ──
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },

  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  logo: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },

  titleBlock: {
    flex: 1,
    gap: 3,
  },

  title: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.2,
  },

  company: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },

  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 10,
  },

  // ── Bottom ──
  bottom: {
    gap: 5,
  },

  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  metaText: {
    fontSize: 10,
    color: "#374151",
    fontWeight: "600",
    flex: 1,
  },

  // Arrow
  arrowBtn: {
    position: "absolute",
    bottom: 13,
    right: 13,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
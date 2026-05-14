import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
} from "react-native";
import YoutubeIframe from "react-native-youtube-iframe";
import { Ionicons } from "@expo/vector-icons";
import * as KeepAwake from "expo-keep-awake";

// ─── Video Config ────────────────────────────────────────────────────────────
const VIDEO_ID = "z0n1aQ3IxWI";
const VIDEO_META = {
  title: "React Native Full Course 2024 – Build Real Apps",
  channel: "Sonny Sangha",
  views: "1.2M views",
  date: "Mar 2024",
  description:
    "In this comprehensive React Native course, you'll learn everything you need to build production-ready mobile apps from scratch. We cover navigation, state management, API integration, Firebase backend, Expo, and much more through hands-on projects.\n\nTopics covered:\n• Setting up your development environment\n• Core components & styling with StyleSheet\n• Navigation with React Navigation v6\n• State management with Redux Toolkit\n• Fetching data from REST APIs\n• Firebase Authentication & Firestore\n• Push notifications with Expo\n• Deploying to App Store & Google Play",
  tags: ["React Native", "Expo", "JavaScript", "Mobile Dev", "Firebase"],
};

// ─── Responsive helpers ──────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get("window");
const isTablet = SW >= 768;
const PLAYER_H = isTablet ? SW * 0.45 : SW * 0.5625; // 16:9

// ─── Component ───────────────────────────────────────────────────────────────
export default function Player() {
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const playerRef = useRef(null);

  // Keep screen awake while playing
  const onStateChange = useCallback((state) => {
    if (state === "playing") {
      KeepAwake.activateKeepAwakeAsync();
      setPlaying(true);
    } else {
      KeepAwake.deactivateKeepAwake();
      if (state !== "buffering") setPlaying(false);
    }
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Player ── */}
      <View style={styles.playerWrapper}>
        <YoutubeIframe
          ref={playerRef}
          height={PLAYER_H}
          width={SW}
          videoId={VIDEO_ID}
          play={playing}
          onChangeState={onStateChange}
          webViewProps={{
            allowsFullscreenVideo: true,
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
          }}
          initialPlayerParams={{
            controls: true,
            modestbranding: true,
            rel: false,
            cc_load_policy: false,
          }}
        />
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>{VIDEO_META.title}</Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {VIDEO_META.views} · {VIDEO_META.date}
          </Text>
        </View>

        {/* Action bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.actionBar}
          contentContainerStyle={styles.actionContent}
        >
          <ActionBtn
            icon={liked ? "thumbs-up" : "thumbs-up-outline"}
            label="Like"
            active={liked}
            onPress={() => setLiked((v) => !v)}
          />
          <ActionBtn
            icon="share-social-outline"
            label="Share"
            onPress={() => {}}
          />
          <ActionBtn
            icon={saved ? "bookmark" : "bookmark-outline"}
            label="Save"
            active={saved}
            onPress={() => setSaved((v) => !v)}
          />
          <ActionBtn icon="download-outline" label="Download" onPress={() => {}} />
          <ActionBtn icon="ellipsis-horizontal" label="More" onPress={() => {}} />
        </ScrollView>

        <View style={styles.divider} />

        {/* Channel row */}
        <View style={styles.channelRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {VIDEO_META.channel.charAt(0)}
            </Text>
          </View>
          <View style={styles.channelInfo}>
            <Text style={styles.channelName}>{VIDEO_META.channel}</Text>
            <Text style={styles.subs}>2.4M subscribers</Text>
          </View>
          <TouchableOpacity style={styles.subBtn} activeOpacity={0.8}>
            <Text style={styles.subBtnText}>Subscribe</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Description */}
        <TouchableOpacity
          style={styles.descBox}
          onPress={() => setExpanded((v) => !v)}
          activeOpacity={0.85}
        >
          <Text
            style={styles.descText}
            numberOfLines={expanded ? undefined : 3}
          >
            {VIDEO_META.description}
          </Text>
          <Text style={styles.descToggle}>
            {expanded ? "Show less" : "Show more"}
          </Text>
        </TouchableOpacity>

        {/* Tags */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagRow}
        >
          {VIDEO_META.tags.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>#{t}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Up-next placeholder */}
        <Text style={styles.sectionHead}>Up Next</Text>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.upNextCard}>
            <View style={styles.upNextThumb} />
            <View style={styles.upNextInfo}>
              <Text style={styles.upNextTitle} numberOfLines={2}>
                React Native Tutorial Part {i + 1} — Advanced Topics
              </Text>
              <Text style={styles.upNextMeta}>Sonny Sangha · 400K views</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <Ionicons
        name={icon}
        size={22}
        color={active ? C.accent : C.textSec}
      />
      <Text style={[styles.actionLabel, active && { color: C.accent }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#0F0F0F",
  surface: "#1A1A1A",
  border: "#272727",
  accent: "#FF0000",
  text: "#F1F1F1",
  textSec: "#AAAAAA",
  textDim: "#717171",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  playerWrapper: {
    width: SW,
    height: PLAYER_H,
    backgroundColor: "#000",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Title / meta
  title: {
    color: C.text,
    fontSize: isTablet ? 20 : 16,
    fontWeight: "700",
    lineHeight: isTablet ? 28 : 22,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  metaRow: {
    paddingHorizontal: 16,
    marginTop: 4,
  },
  meta: {
    color: C.textSec,
    fontSize: 13,
  },

  // Actions
  actionBar: {
    marginTop: 12,
  },
  actionContent: {
    paddingHorizontal: 12,
    gap: 4,
  },
  actionBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    flexDirection: "row",
    gap: 6,
  },
  actionLabel: {
    color: C.textSec,
    fontSize: 13,
    fontWeight: "500",
  },

  divider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 16,
    marginVertical: 14,
  },

  // Channel
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    color: C.text,
    fontWeight: "600",
    fontSize: 14,
  },
  subs: {
    color: C.textSec,
    fontSize: 12,
    marginTop: 2,
  },
  subBtn: {
    backgroundColor: C.text,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  subBtnText: {
    color: C.bg,
    fontWeight: "700",
    fontSize: 13,
  },

  // Description
  descBox: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  descText: {
    color: C.textSec,
    fontSize: 13,
    lineHeight: 20,
  },
  descToggle: {
    color: C.text,
    fontWeight: "600",
    fontSize: 13,
    marginTop: 6,
  },

  // Tags
  tagRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  tag: {
    backgroundColor: C.surface,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  tagText: {
    color: "#3EA6FF",
    fontSize: 12,
    fontWeight: "500",
  },

  // Up next
  sectionHead: {
    color: C.text,
    fontWeight: "700",
    fontSize: 15,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  upNextCard: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  upNextThumb: {
    width: isTablet ? 180 : 160,
    height: isTablet ? 101 : 90,
    borderRadius: 8,
    backgroundColor: C.surface,
  },
  upNextInfo: {
    flex: 1,
    justifyContent: "center",
  },
  upNextTitle: {
    color: C.text,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  upNextMeta: {
    color: C.textSec,
    fontSize: 12,
    marginTop: 4,
  },
});
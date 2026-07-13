import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../utils/dummyData";
import API from "../../utils/axiosInstanct";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ease = () =>
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

// ─── Helpers ──────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  if (!dateStr) return "";

  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 6) return new Date(dateStr).toLocaleDateString();
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
};

const ICON_BY_TYPE = {
  job: "briefcase",
  course: "book",
  application: "document-text",
  payment: "card",
  general: "notifications",
};

// ─── Skeleton ─────────────────────────────────────────────────
const Skeleton = memo(() => {
  const fade = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[s.card, { opacity: fade }]}>
      <View style={s.skIcon} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={[s.skLine, { width: "60%" }]} />
        <View style={[s.skLine, { width: "95%", height: 10 }]} />
        <View style={[s.skLine, { width: "40%", height: 9 }]} />
      </View>
    </Animated.View>
  );
});

// ─── Notification Card ────────────────────────────────────────
const NotifCard = memo(function NotifCard({
  item,
  expanded,
  selected,
  selectMode,
  onPress,
  onLongPress,
  onDelete,
}) {
  const unread = !item.is_read;
  const icon = ICON_BY_TYPE[item.type] || "notifications";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={250}
      style={[
        s.card,
        unread && s.cardUnread,
        selected && s.cardSelected,
      ]}
    >
      {selectMode ? (
        <View style={[s.checkBox, selected && s.checkBoxOn]}>
          {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
      ) : (
        <View style={[s.icon, unread && s.iconUnread]}>
          <Ionicons
            name={icon}
            size={19}
            color={unread ? COLORS.primary : "#9ca3af"}
          />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <View style={s.titleRow}>
          <Text style={[s.title, unread && s.titleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          {unread && <View style={s.dot} />}
        </View>

        <Text
          style={s.msg}
          numberOfLines={expanded ? undefined : 2}
        >
          {item.message}
        </Text>

        <View style={s.metaRow}>
          <Ionicons name="time-outline" size={11} color="#9ca3af" />
          <Text style={s.time}>{timeAgo(item.created_at)}</Text>

          {!selectMode && String(item.message || "").length > 80 && (
            <Text style={s.expandHint}>
              {expanded ? "  ·  Tap to collapse" : "  ·  Tap to read more"}
            </Text>
          )}
        </View>
      </View>

      {!selectMode && (
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={s.trash}
        >
          <Ionicons name="trash-outline" size={17} color="#c4c4cc" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
});

// ─── Screen ───────────────────────────────────────────────────
export function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const allSelected =
    notifications.length > 0 && selected.size === notifications.length;

  // ─── Fetch ──────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await API.get("/extra/notification");
      setNotifications(res.data?.data || []);
    } catch (error) {
      console.log("[notifications]", error?.response?.data || error?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    exitSelect();
    fetchNotifications();
  };

  // ─── Selection ──────────────────────────────────────────────
  const enterSelect = (id) => {
    ease();
    setSelectMode(true);
    setSelected(new Set([id]));
    setExpandedId(null);
  };

  const exitSelect = () => {
    ease();
    setSelectMode(false);
    setSelected(new Set());
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);

      if (next.size === 0) {
        ease();
        setSelectMode(false);
      }

      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(
      allSelected ? new Set() : new Set(notifications.map((n) => n.id))
    );
  };

  const onCardPress = (item) => {
    if (selectMode) {
      toggleSelect(item.id);
      return;
    }

    ease();
    setExpandedId((prev) => (prev === item.id ? null : item.id));

    if (!item.is_read) markAsRead(item.id);
  };

  // ─── Single actions ─────────────────────────────────────────
  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
    );

    try {
      await API.put(`/extra/notification/read/${id}`);
    } catch (error) {
      console.log("[markAsRead]", error?.response?.data || error?.message);
    }
  };

  const deleteOne = (id) => {
    Alert.alert("Delete Notification", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const backup = notifications;

          ease();
          setNotifications((prev) => prev.filter((n) => n.id !== id));

          try {
            await API.delete(`/extra/notification/${id}`);
          } catch (error) {
            setNotifications(backup);
            Alert.alert("Error", "Could not delete. Please try again.");
          }
        },
      },
    ]);
  };

  const markAllRead = async () => {
    if (!unreadCount) return;

    const backup = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));

    try {
      await API.put("/extra/notification/read-all");
    } catch (error) {
      setNotifications(backup);
      Alert.alert("Error", "Could not mark all as read.");
    }
  };

  // ─── Bulk actions ───────────────────────────────────────────
  const bulkRead = async () => {
    const ids = [...selected];
    if (!ids.length) return;

    const backup = notifications;
    setBusy(true);

    setNotifications((prev) =>
      prev.map((n) => (selected.has(n.id) ? { ...n, is_read: 1 } : n))
    );

    try {
      await API.put("/extra/notification/bulk-read", { ids });
      exitSelect();
    } catch (error) {
      setNotifications(backup);
      Alert.alert("Error", "Could not mark selected as read.");
    } finally {
      setBusy(false);
    }
  };

  const bulkDelete = () => {
    const ids = [...selected];
    if (!ids.length) return;

    Alert.alert(
      `Delete ${ids.length} notification${ids.length > 1 ? "s" : ""}?`,
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const backup = notifications;
            setBusy(true);

            ease();
            setNotifications((prev) => prev.filter((n) => !selected.has(n.id)));

            try {
              await API.post("/extra/notification/bulk-delete", { ids });
              exitSelect();
            } catch (error) {
              setNotifications(backup);
              Alert.alert("Error", "Could not delete selected.");
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  // ─── Render ─────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }) => (
      <NotifCard
        item={item}
        expanded={expandedId === item.id}
        selected={selected.has(item.id)}
        selectMode={selectMode}
        onPress={() => onCardPress(item)}
        onLongPress={() => (selectMode ? toggleSelect(item.id) : enterSelect(item.id))}
        onDelete={() => deleteOne(item.id)}
      />
    ),
    [expandedId, selected, selectMode, notifications]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        {selectMode ? (
          <>
            <TouchableOpacity onPress={exitSelect} hitSlop={10}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>

            <Text style={s.headerTitle}>{selected.size} selected</Text>

            <TouchableOpacity onPress={toggleSelectAll} hitSlop={10}>
              <Text style={s.headerAction}>
                {allSelected ? "Clear" : "Select all"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>

            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeTxt}>{unreadCount}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={markAllRead}
              disabled={!unreadCount}
              hitSlop={10}
            >
              <Text
                style={[s.headerAction, !unreadCount && { color: "#c4c4cc" }]}
              >
                Mark all read
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Hint */}
      {!selectMode && !loading && notifications.length > 0 && (
        <Text style={s.hint}>Long press to select multiple</Text>
      )}

      {/* Body */}
      {loading ? (
        <View style={{ padding: 16 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          extraData={{ expandedId, selected, selectMode }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyRing}>
                <Ionicons name="notifications-off-outline" size={38} color={COLORS.primary} />
              </View>
              <Text style={s.emptyTitle}>No Notifications</Text>
              <Text style={s.emptySub}>You're all caught up.</Text>
            </View>
          }
          contentContainerStyle={{
            padding: 16,
            paddingBottom: selectMode ? 110 : 40,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === "android"}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={11}
        />
      )}

      {/* Bulk action bar */}
      {selectMode && (
        <View style={[s.bulkBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[s.bulkBtn, s.bulkRead]}
            onPress={bulkRead}
            disabled={busy || !selected.size}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={17} color={COLORS.primary} />
                <Text style={s.bulkReadTxt}>Mark Read</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.bulkBtn, s.bulkDelete]}
            onPress={bulkDelete}
            disabled={busy || !selected.size}
            activeOpacity={0.85}
          >
            <Ionicons name="trash-outline" size={17} color="#fff" />
            <Text style={s.bulkDeleteTxt}>
              Delete ({selected.size})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ececf1",
  },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  headerAction: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTxt: { fontSize: 10, fontWeight: "800", color: "#fff" },

  hint: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
    paddingTop: 10,
    paddingBottom: 2,
  },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f0f0f4",
  },
  cardUnread: {
    borderColor: COLORS.primaryLight,
    backgroundColor: "#fff",
  },
  cardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: COLORS.primaryLight,
  },

  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f4f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  iconUnread: { backgroundColor: COLORS.primaryLight },

  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "#d4d4d8",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkBoxOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, fontSize: 14, fontWeight: "700", color: COLORS.text },
  titleUnread: { fontWeight: "800" },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  msg: { fontSize: 12.5, color: "#52525b", lineHeight: 19, marginTop: 4 },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  time: { fontSize: 11, color: "#9ca3af", fontWeight: "600" },
  expandHint: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },

  trash: { padding: 2 },

  // Skeleton
  skIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#e8e8ee" },
  skLine: { height: 12, borderRadius: 6, backgroundColor: "#e8e8ee" },

  // Empty
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 110 },
  emptyRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  emptySub: { fontSize: 13, color: "#9ca3af", marginTop: 6 },

  // Bulk bar
  bulkBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ececf1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  bulkBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 13,
    borderRadius: 12,
  },
  bulkRead: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  bulkReadTxt: { fontSize: 13, fontWeight: "800", color: COLORS.primary },
  bulkDelete: { backgroundColor: "#e11d48" },
  bulkDeleteTxt: { fontSize: 13, fontWeight: "800", color: "#fff" },
});
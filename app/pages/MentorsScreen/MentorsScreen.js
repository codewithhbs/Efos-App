import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { COLORS } from "../../utils/dummyData";
import useAuthStore from "../../store/useAuthStore";
import { Loader, AuthWarn } from "../../components/LoadingAndAuthWarn";
import API from "../../utils/axiosInstanct";

// ─── Avatar with icon fallback ────────────────────────────────────────────────
function Avatar({ uri, size = 58 }) {
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

// ─── Stat chip ────────────────────────────────────────────────────────────────
function Chip({ icon, label }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={11} color={COLORS.primary} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MentorsScreen({ navigation }) {
  const { user } = useAuthStore();

  const [mentors, setMentors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadMore, setLoadMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const fetchMentorsCategory = async () => {
    try {
      const res = await API.get("/extra/mentors-categories");
      setCategories([{ id: "all", name: "All" }, ...res.data.data]);
    } catch (e) { console.log(e); }
  };

  const fetchMentors = async (pageNo = 1, reset = false) => {
    try {
      if (pageNo === 1) setLoading(true);
      else setLoadMore(true);

      let url = `/extra/mentors?page=${pageNo}&limit=10`;
      if (search) url += `&search=${search}`;

      const res = await API.get(url);
      const response = res.data;

      setPage(response.page);
      setTotalPages(response.totalPages);
      if (reset) setMentors(response.data);
      else setMentors((prev) => [...prev, ...response.data]);
    } catch (e) { console.log(e); }
    finally {
      setLoading(false);
      setLoadMore(false);
    }
  };

  useEffect(() => {
    fetchMentorsCategory();
    fetchMentors(1, true);
  }, []);

  const handleSearch = () => { setPage(1); fetchMentors(1, true); };

  const handleLoadMore = () => {
    if (page < totalPages && !loadMore) fetchMentors(page + 1);
  };

  const filteredMentors =
    selectedCategory === "All"
      ? mentors
      : mentors.filter((m) => m.category_name === selectedCategory);

  if (!user) return <AuthWarn />;
  if (loading) return <Loader />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <FlatList
        data={filteredMentors}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}

        ListHeaderComponent={
          <View>

            {/* ── Hero Banner ─────────────────────────────────────────────── */}
            <LinearGradient
              colors={["#a33030", "#e54646", "#f16363"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              {/* Decorative circles */}
              <View style={styles.decoA} />
              <View style={styles.decoB} />
              <View style={styles.decoC} />

              {/* Top badge */}
              <View style={styles.heroBadge}>
                <Ionicons name="flash" size={11} color="#FCD34D" />
                <Text style={styles.heroBadgeText}>MENTORSHIP PLATFORM</Text>
              </View>

              {/* Headline */}
              <Text style={styles.heroH1}>
                Learn from the{"\n"}
                <Text style={styles.heroAccent}>Best Experts</Text>
              </Text>

              <Text style={styles.heroSub}>
                Connect with verified mentors across design,{"\n"}tech, business &amp; more.
              </Text>

              {/* Stats row */}
              {/* <View style={styles.statsRow}>
                {[
                  { num: "200+", lbl: "Mentors" },
                  { num: "50+",  lbl: "Skills" },
                  { num: "10k+", lbl: "Students" },
                ].map((s, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={styles.statDivider} />}
                    <View style={styles.statItem}>
                      <Text style={styles.statNum}>{s.num}</Text>
                      <Text style={styles.statLbl}>{s.lbl}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View> */}
            </LinearGradient>

            {/* ── Search Bar ──────────────────────────────────────────────── */}
            <View style={styles.searchOuter}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={17} color="#94A3B8" />
                <TextInput
                  placeholder="Search mentors, skills..."
                  placeholderTextColor="#CBD5E1"
                  value={search}
                  onChangeText={setSearch}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  style={styles.searchInput}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => { setSearch(""); setPage(1); fetchMentors(1, true); }}>
                    <Ionicons name="close-circle" size={17} color="#CBD5E1" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ── Category Tabs — View with flexWrap ──────────────────────── */}
            <View style={styles.tabsWrap}>
              {categories.map((item) => {
                const active = selectedCategory === item.name;
                return (
                  <TouchableOpacity
                    key={item.id.toString()}
                    onPress={() => setSelectedCategory(item.name)}
                    activeOpacity={0.75}
                    style={[styles.tab, active && styles.tabActive]}
                  >
                    {active && <View style={styles.tabDot} />}
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Section label ────────────────────────────────────────────── */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>
                {selectedCategory === "All" ? "All Mentors" : selectedCategory}
              </Text>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{filteredMentors.length}</Text>
              </View>
            </View>

          </View>
        }

        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people-outline" size={36} color="#C7D2FE" />
            </View>
            <Text style={styles.emptyTitle}>No mentors found</Text>
            <Text style={styles.emptySub}>Try a different category or keyword</Text>
          </View>
        }

        ListFooterComponent={
          loadMore
            ? <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
            : null
        }

        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => navigation.navigate("MentorDetails", { id: item.id })}
            style={styles.card}
          >
            {/* Accent left bar */}
            <View style={styles.cardBar} />

            <View style={styles.cardInner}>
              {/* Avatar */}
              <View>
                <Avatar uri={item.profile_photo} size={60} />
                <View style={styles.onlineRing}>
                  <View style={styles.onlineDot} />
                </View>
              </View>

              {/* Info */}
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{item.name}</Text>

                <View style={styles.catRow}>
                  <View style={styles.catPill}>
                    <Text style={styles.catPillText}>{item.category_name}</Text>
                  </View>
                </View>

                <Text numberOfLines={2} style={styles.cardBio}>
                  {item.shortbio}
                </Text>

                <View style={styles.chipRow}>
                  <Chip icon="star-outline" label="Top Rated" />
                  <Chip icon="time-outline" label="Fast Reply" />
                </View>
              </View>

              {/* Arrow */}
              <Ionicons name="chevron-forward" size={18} color="#C7D2FE" style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F5F6FB",
  },
  listContent: {
    paddingBottom: 36,
  },

  // ── Hero ────────────────────────────────────────────────────────────────────
  hero: {
    paddingTop: 26,
    paddingBottom: 40,
    paddingHorizontal: 22,
    overflow: "hidden",
  },
  decoA: {
    position: "absolute", width: 220, height: 220, borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.07)", top: -70, right: -55,
  },
  decoB: {
    position: "absolute", width: 110, height: 110, borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.06)", bottom: 0, right: 50,
  },
  decoC: {
    position: "absolute", width: 55, height: 55, borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.09)", top: 28, right: 120,
  },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 14,
  },
  heroBadgeText: {
    color: "#FCD34D", fontSize: 10, fontWeight: "700", letterSpacing: 1.2,
  },
  heroH1: {
    fontSize: 30, fontWeight: "800", color: "#fff",
    lineHeight: 38, letterSpacing: -0.4,
  },
  heroAccent: {
    color: "#FCD34D",
  },
  heroSub: {
    color: "rgba(255,255,255,0.72)", fontSize: 13,
    marginTop: 8, lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingVertical: 12,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statLbl: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.18)", marginVertical: 4 },

  // ── Search ──────────────────────────────────────────────────────────────────
  searchOuter: {
    paddingHorizontal: 18,
    marginTop: -22,
    marginBottom: 6,
  },
  searchBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: "#E8EDF5",
  },
  searchInput: {
    flex: 1, marginLeft: 9,
    fontSize: 14, color: "#1E293B", fontWeight: "500",
  },

  // ── Tabs ────────────────────────────────────────────────────────────────────
  tabsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 22,
    backgroundColor: "#EAECF5",
    marginBottom: 4,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: "#FCD34D",
  },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#fff" },

  // ── Section Row ─────────────────────────────────────────────────────────────
  sectionRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 18,
    marginTop: 10, marginBottom: 10,
    gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  countPill: {
    backgroundColor: COLORS.primary,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  countPillText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  // ── Card ────────────────────────────────────────────────────────────────────
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    marginHorizontal: 18,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#EEF1F8",
  },
  cardBar: {
    width: 4,
    backgroundColor: COLORS.primary,
  },
  cardInner: {
    flex: 1, flexDirection: "row", alignItems: "center",
    padding: 14,
  },
  avatarFallback: {
    backgroundColor: "#EEF2FF",
    alignItems: "center", justifyContent: "center",
  },
  onlineRing: {
    position: "absolute", bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  onlineDot: {
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: "#22C55E",
  },
  cardBody: { flex: 1, marginLeft: 12 },
  cardName: {
    fontSize: 15, fontWeight: "700",
    color: "#0F172A", letterSpacing: -0.2,
  },
  catRow: { flexDirection: "row", marginTop: 4, marginBottom: 5 },
  catPill: {
    backgroundColor: "#EEF2FF",
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  catPillText: { fontSize: 11, fontWeight: "600", color: COLORS.primary },
  cardBio: { fontSize: 12, color: "#94A3B8", lineHeight: 17 },
  chipRow: { flexDirection: "row", marginTop: 8, gap: 6 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#F8FAFF",
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: "#E8EEFF",
  },
  chipText: { fontSize: 10, fontWeight: "600", color: "#64748B" },

  // ── Empty ────────────────────────────────────────────────────────────────────
  emptyBox: { alignItems: "center", paddingTop: 50, paddingBottom: 30 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#EEF2FF",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#94A3B8" },
  emptySub: { fontSize: 12, color: "#CBD5E1", marginTop: 4 },
});
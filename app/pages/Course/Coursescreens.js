import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
  memo
} from "react"
import {
  View,
  Text,
  StatusBar,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Animated,
  RefreshControl,
  Dimensions,
  Platform,
  Modal
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import API from "../../utils/axiosInstanct"
import useAuthStore from "../../store/useAuthStore"

const { width: SCREEN_WIDTH } = Dimensions.get("window")
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2

// ─── Theme: white bg, black text, red accent ─────────────────────────────────
const T = {
  bg: "#f7f7f9",
  card: "#ffffff",
  cardBorder: "#e8e8f0",
  surface: "#f0f0f5",
  accent: "#e8001c",
  accentSoft: "#ffedf0",
  accentDark: "#b50016",
  gold: "#e6820a",
  goldSoft: "#fff7e6",
  green: "#16a34a",
  greenSoft: "#f0fdf4",
  text: "#0d0d0d",
  textSub: "#52525b",
  textMuted: "#a1a1aa",
  chip: "#f0f0f5",
  chipBorder: "#e0e0ea",
  ribbon: "#e8001c",
  heart: "#e8001c",
  white: "#ffffff",
  headerBorder: "#ebebf0"
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "free", label: "Free" },
  { id: "paid", label: "Paid" },
  { id: "featured", label: "⭐ Featured" },
  { id: "beginner", label: "Beginner" },
  { id: "advanced", label: "Advanced" }
]

const SORT_OPTIONS = [
  { id: "default", label: "Default" },
  { id: "price_asc", label: "Price: Low → High" },
  { id: "price_desc", label: "Price: High → Low" },
  { id: "title_asc", label: "Title: A → Z" },
  { id: "title_desc", label: "Title: Z → A" }
]

// ─── Sort fn ──────────────────────────────────────────────────────────────────
function applySortCourses(list, id) {
  switch (id) {
    case "price_asc":
      return [...list].sort((a, b) => a.final_price - b.final_price)
    case "price_desc":
      return [...list].sort((a, b) => b.final_price - a.final_price)
    case "title_asc":
      return [...list].sort((a, b) => a.title.localeCompare(b.title))
    case "title_desc":
      return [...list].sort((a, b) => b.title.localeCompare(a.title))
    default:
      return list
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard = memo(() => {
  const shimmer = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 850,
          useNativeDriver: true
        })
      ])
    ).start()
  }, [])
  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.85]
  })
  return (
    <View style={[styles.card, { width: CARD_WIDTH }]}>
      <Animated.View style={[styles.skeletonImg, { opacity }]} />
      <View style={styles.cardContent}>
        <Animated.View
          style={[styles.skeletonLine, { opacity, width: "80%" }]}
        />
        <Animated.View
          style={[styles.skeletonLine, { opacity, width: "55%", marginTop: 6 }]}
        />
        <Animated.View
          style={[
            styles.skeletonLine,
            { opacity, width: "40%", marginTop: 10 }
          ]}
        />
      </View>
    </View>
  )
})

const SkeletonGrid = memo(() => (
  <View style={styles.skeletonGrid}>
    {Array.from({ length: 6 }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </View>
))

// ─── Featured ribbon ──────────────────────────────────────────────────────────
const FeaturedRibbon = memo(() => (
  <View style={styles.ribbon}>
    <Text style={styles.ribbonText}>FEATURED</Text>
  </View>
))

// ─── Price badge ──────────────────────────────────────────────────────────────
const PriceBadge = memo(({ price }) => (
  <View
    style={[
      styles.priceBadge,
      price === 0 ? styles.priceFree : styles.pricePaid
    ]}
  >
    <Text style={styles.priceText}>{price === 0 ? "FREE" : `₹${price}`}</Text>
  </View>
))

const CourseCard = memo(({ item, onWishlist, wishlist, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current
  const heartScale = useRef(new Animated.Value(1)).current
  const isWished = wishlist.has(item.id)

  const onIn = () =>
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30
    }).start()
  const onOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20
    }).start()

  const onHeart = () => {
    onWishlist(item.id)
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.45,
        useNativeDriver: true,
        speed: 30
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20
      })
    ]).start()
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, { width: CARD_WIDTH }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}          // only click here
        onPressIn={onIn}          // animation only
        onPressOut={onOut}

        style={styles.card}
      >
        <View style={styles.imgWrapper}>
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.cardImg}
            resizeMode="cover"
          />
          <View style={styles.imgOverlay} />
          {item.featured === 1 && <FeaturedRibbon />}
          <TouchableOpacity
            onPress={onHeart}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.heartBtn}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={isWished ? "heart" : "heart-outline"}
                size={18}
                color={isWished ? T.heart : T.white}
              />
            </Animated.View>
          </TouchableOpacity>
          <View style={styles.priceBadgePos}>
            <PriceBadge price={item.final_price} />
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text numberOfLines={2} style={styles.cardTitle}>
            {item.title}
          </Text>
          <Text numberOfLines={2} style={styles.cardDesc}>
            {item.short_description}
          </Text>

          <View style={styles.metaRow}>

            {item.language && (
              <View style={[styles.metaChip, { backgroundColor: T.surface }]}>
                <Ionicons name="globe-outline" size={9} color={T.textSub} />
                <Text style={[styles.metaText, { color: T.textSub }]}>
                  {item.language}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.durationRow}>
            <Ionicons name="time-outline" size={11} color={T.textMuted} />
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>

          {item.isAlreadyPurchase ? (
            <View style={styles.enrolledBadge}>
              <Ionicons name="checkmark-circle" size={12} color={T.green} />
              <Text style={styles.enrolledText}>Enrolled</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={onPress}
              onPressIn={onIn}
              onPressOut={onOut} style={styles.ctaBtn} activeOpacity={0.85}>
              <Text style={styles.ctaText}>
                {item.final_price === 0 ? "Start Free" : "Enroll Now"}
              </Text>
              <Ionicons name="arrow-forward" size={11} color={T.white} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
})

const CategoryChip = memo(({ label, active, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current
  const press = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.9,
        useNativeDriver: true,
        speed: 40
      }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 })
    ]).start()
    onPress()
  }
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={press}
        activeOpacity={0.85}
        style={[styles.chip, active && styles.chipActive]}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
})

const SortModal = memo(({ visible, current, onSelect, onClose }) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <TouchableOpacity
      style={styles.overlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Sort By</Text>
        {SORT_OPTIONS.map(opt => {
          const active = current === opt.id
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => {
                onSelect(opt.id)
                onClose()
              }}
              style={[styles.sortRow, active && styles.sortRowActive]}
            >
              <Text
                style={[styles.sortRowText, active && styles.sortRowTextActive]}
              >
                {opt.label}
              </Text>
              {active && (
                <Ionicons name="checkmark-circle" size={18} color={T.accent} />
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </TouchableOpacity>
  </Modal>
))

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = memo(({ query }) => (
  <View style={styles.emptyWrap}>
    <View style={styles.emptyRing}>
      <Ionicons name="search-outline" size={36} color={T.accent} />
    </View>
    <Text style={styles.emptyTitle}>No courses found</Text>
    <Text style={styles.emptySub}>
      {query ? `No results for "${query}"` : "Check back soon for new content"}
    </Text>
  </View>
))

// ─── Footer loader ────────────────────────────────────────────────────────────
const FooterLoader = memo(() => (
  <View style={styles.footerLoader}>
    <ActivityIndicator size="small" color={T.accent} />
    <Text style={styles.footerText}>Loading more…</Text>
  </View>
))

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Coursescreens({ navigation }) {
  const user = useAuthStore(state => state.user)
  const [courses, setCourses] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [sortId, setSortId] = useState("default")
  const [sortVisible, setSortVisible] = useState(false)
  const [wishlist, setWishlist] = useState(new Set())

  const scrollY = useRef(new Animated.Value(0)).current
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0.97],
    extrapolate: "clamp"
  })

  // Fetch
  const fetchCourses = useCallback(
    async (pageNumber = 1, isLoadMore = false, isRefresh = false) => {
      try {
        if (isLoadMore) setLoadingMore(true)
        else if (isRefresh) setRefreshing(true)
        else setLoading(true)

        const response = await API.get(
          `/extra/home-learning-course?page=${pageNumber}&limit=10`
        )
        const resData = response.data
        const newCourses = resData.data || []

        if (isLoadMore) setCourses(prev => [...prev, ...newCourses])
        else setCourses(newCourses)

        setPage(resData.currentPage)
        setTotalPages(resData.totalPages)
      } catch (err) {
        console.log("Course Error:", err)
      } finally {
        setLoading(false)
        setLoadingMore(false)
        setRefreshing(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchCourses(1)
  }, [])

  const loadMore = useCallback(() => {
    if (!loadingMore && page < totalPages) fetchCourses(page + 1, true)
  }, [loadingMore, page, totalPages, fetchCourses])

  const onRefresh = useCallback(() => fetchCourses(1, false, true), [
    fetchCourses
  ])

  const toggleWishlist = useCallback(id => {
    setWishlist(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  // Filter + sort (client-side)
  const filtered = useMemo(() => {
    let list = courses

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        c =>
          c.title.toLowerCase().includes(q) ||
          (c.short_description || "").toLowerCase().includes(q)
      )
    }

    switch (activeCategory) {
      case "free":
        list = list.filter(c => c.final_price === 0)
        break
      case "paid":
        list = list.filter(c => c.final_price > 0)
        break
      case "featured":
        list = list.filter(c => c.featured === 1)
        break
      case "beginner":
        list = list.filter(c => c.level?.toLowerCase().includes("beginner"))
        break
      case "advanced":
        list = list.filter(c => c.level?.toLowerCase().includes("advanced"))
        break
    }

    return applySortCourses(list, sortId)
  }, [courses, search, activeCategory, sortId])

  // 2-col rows
  const rows = useMemo(() => {
    const pairs = []
    for (let i = 0; i < filtered.length; i += 2)
      pairs.push(filtered.slice(i, i + 2))
    return pairs
  }, [filtered])

  const handleNavigate = (courseId) => {
    navigation.navigate('CourseDetail', { courseId: courseId, userId: user.id })
  }

  const renderRow = useCallback(
    ({ item }) => (
      <View style={styles.gridRow}>
        {item.map(course => (
          <CourseCard
            key={course.id}
            item={course}
            onPress={() => handleNavigate(course.id)}
            onWishlist={toggleWishlist}
            wishlist={wishlist}
          />
        ))}
        {item.length === 1 && <View style={{ width: CARD_WIDTH }} />}
      </View>
    ),
    [toggleWishlist, wishlist]
  )

  const keyExtractor = useCallback((_, i) => `row-${i}`, [])

  const activeSortLabel =
    SORT_OPTIONS.find(o => o.id === sortId)?.label ?? "Sort"

  // Header rendered as JSX (not memoized) so chip state updates propagate
  const ListHeader = (
    <View>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons
          name="search-outline"
          size={18}
          color={T.textMuted}
          style={{ marginRight: 10 }}
        />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search courses…"
          placeholderTextColor={T.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch("")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color={T.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips – horizontal FlatList */}
      <FlatList
        data={CATEGORIES}
        horizontal
        keyExtractor={c => c.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
        renderItem={({ item }) => (
          <CategoryChip
            label={item.label}
            active={activeCategory === item.id}
            onPress={() => setActiveCategory(item.id)}
          />
        )}
      />

      {/* Count + Sort button */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filtered.length} course{filtered.length !== 1 ? "s" : ""}
          {activeCategory !== "all" && (
            <Text style={{ color: T.accent }}>
              {" "}
              · {CATEGORIES.find(c => c.id === activeCategory)?.label}
            </Text>
          )}
        </Text>
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setSortVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={14} color={T.accent} />
          <Text style={styles.sortBtnText} numberOfLines={1}>
            {sortId === "default" ? "Sort" : activeSortLabel}
          </Text>
          <Ionicons name="chevron-down" size={12} color={T.accent} />
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={T.white} />

      {/* Sticky header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEyebrow}>EXPLORE</Text>
          <Text style={styles.headerTitle}>Learning Hub</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate("Notifications")} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={T.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={16} color={T.white} />
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1 }}>
          {ListHeader}
          <SkeletonGrid />
        </View>
      ) : (
        <Animated.FlatList
          data={rows}
          keyExtractor={keyExtractor}
          renderItem={renderRow}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={<EmptyState query={search} />}
          ListFooterComponent={
            loadingMore ? <FooterLoader /> : <View style={{ height: 40 }} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={T.accent}
              colors={[T.accent]}
            />
          }
          removeClippedSubviews={Platform.OS === "android"}
          maxToRenderPerBatch={6}
          windowSize={10}
          initialNumToRender={4}
        />
      )}

      {/* Sort modal */}
      <SortModal
        visible={sortVisible}
        current={sortId}
        onSelect={setSortId}
        onClose={() => setSortVisible(false)}
      />
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: T.white,
    borderBottomWidth: 1,
    borderBottomColor: T.headerBorder,
    zIndex: 10
  },
  headerLeft: { flex: 1 },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.5,
    color: T.accent,
    marginBottom: 2
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: T.text,
    letterSpacing: -0.5
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.accent,
    borderWidth: 1.5,
    borderColor: T.white
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.accent,
    alignItems: "center",
    justifyContent: "center"
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.white,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
    borderWidth: 1.5,
    borderColor: T.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 0.01
  },
  searchInput: { flex: 1, fontSize: 14, color: T.text, fontWeight: "500" },

  chipsContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: T.chip,
    borderWidth: 1.5,
    borderColor: T.chipBorder,
    marginRight: 8
  },
  chipActive: { backgroundColor: T.accent, borderColor: T.accent },
  chipText: { fontSize: 13, fontWeight: "700", color: T.textSub },
  chipTextActive: { color: T.white },

  countRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10
  },
  countText: {
    fontSize: 13,
    color: T.textMuted,
    fontWeight: "600",
    flex: 1,
    marginRight: 8
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: T.accentSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#ffc9cf"
  },
  sortBtnText: { fontSize: 12, color: T.accent, fontWeight: "700" },

  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 16
  },

  card: {
    backgroundColor: T.white,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: T.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 0.02
  },
  imgWrapper: { position: "relative" },
  cardImg: { width: "100%", height: CARD_WIDTH * 0.65 },
  imgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)"
  },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  priceBadgePos: { position: "absolute", bottom: 8, left: 8 },

  cardContent: { padding: 12, paddingBottom: 14 },
  cardTitle: { fontSize: 13, fontWeight: "800", color: T.text, lineHeight: 18 },
  cardDesc: { fontSize: 11, color: T.textSub, marginTop: 5, lineHeight: 15 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 8 },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: T.accentSoft,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  metaText: { fontSize: 10, fontWeight: "700", color: T.accent },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6
  },
  durationText: { fontSize: 10, color: T.textMuted, fontWeight: "500" },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
    backgroundColor: T.accent,
    borderRadius: 10,
    paddingVertical: 8
  },
  ctaText: {
    fontSize: 11,
    fontWeight: "800",
    color: T.white,
    letterSpacing: 0.3
  },
  enrolledBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
    backgroundColor: T.greenSoft,
    borderRadius: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(22,163,74,0.25)"
  },
  enrolledText: { fontSize: 11, fontWeight: "800", color: T.green },

  priceBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  priceFree: { backgroundColor: "rgba(22,163,74,0.88)" },
  pricePaid: { backgroundColor: "rgba(232,0,28,0.88)" },
  priceText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: T.white
  },

  ribbon: {
    position: "absolute",
    top: 10,
    left: -22,
    backgroundColor: T.ribbon,
    transform: [{ rotate: "-35deg" }],
    paddingHorizontal: 24,
    paddingVertical: 3
  },
  ribbonText: {
    fontSize: 7,
    fontWeight: "900",
    color: T.white,
    letterSpacing: 1
  },

  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 16,
    justifyContent: "space-between",
    marginTop: 8
  },
  skeletonImg: {
    width: "100%",
    height: CARD_WIDTH * 0.65,
    backgroundColor: "#e4e4ec"
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e4e4ec",
    marginTop: 8
  },

  // Sort modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.32)",
    justifyContent: "flex-end"
  },
  sheet: {
    backgroundColor: T.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 56,
    paddingTop: 12
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.cardBorder,
    alignSelf: "center",
    marginBottom: 16
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: T.text,
    marginBottom: 14
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.cardBorder
  },
  sortRowActive: {},
  sortRowText: { fontSize: 15, fontWeight: "600", color: T.textSub },
  sortRowTextActive: { color: T.accent, fontWeight: "800" },

  // Empty
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 32
  },
  emptyRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: T.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#ffc9cf"
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: T.text,
    marginBottom: 8
  },
  emptySub: {
    fontSize: 14,
    color: T.textMuted,
    textAlign: "center",
    lineHeight: 20
  },

  footerLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20
  },
  footerText: { fontSize: 13, color: T.textMuted, fontWeight: "600" },
  flatContent: { paddingBottom: 40 }
})

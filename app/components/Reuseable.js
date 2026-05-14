import React from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../utils/dummyData"
import { useRef } from "react"
import { LinearGradient } from 'expo-linear-gradient';
const { width } = Dimensions.get("window")
const CARD_WIDTH = width * 0.72;
// ---- CourseCard ----
export const CourseCard = ({ item, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
 
  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, friction: 6, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
 
  const isFree = item.is_free;
  const hasDiscount = !isFree && item.has_discount;
 
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* ── Thumbnail ── */}
        <View style={styles.thumbWrap}>
          <Image
            source={{
              uri: item?.thumbnail || 'https://via.placeholder.com/300x200?text=No+Image',
            }}
            style={styles.thumb}
            resizeMode="cover"
          />
 
          {/* Gradient overlay bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={styles.thumbGrad}
          />
 
          {/* Badge */}
          {isFree ? (
            <LinearGradient colors={['#10B981', '#059669']} style={styles.badge}>
              <Ionicons name="gift-outline" size={9} color="#fff" />
              <Text style={styles.badgeText}>FREE</Text>
            </LinearGradient>
          ) : hasDiscount ? (
            <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.badge}>
              <Ionicons name="pricetag-outline" size={9} color="#fff" />
              <Text style={styles.badgeText}>SALE</Text>
            </LinearGradient>
          ) : null}
 
          {/* Level chip on image */}
          <View style={styles.levelChip}>
            <Ionicons name="bar-chart-outline" size={9} color="rgba(255,255,255,0.9)" />
            <Text style={styles.levelText}>{item.level || 'All levels'}</Text>
          </View>
        </View>
 
        {/* ── Body ── */}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.desc} numberOfLines={2}>{item.short_description}</Text>
 
          {/* Meta pills */}
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Ionicons name="time-outline" size={10} color={COLORS.primary} />
              <Text style={styles.metaText}>{item.duration}</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="language-outline" size={10} color={COLORS.primary} />
              <Text style={styles.metaText}>{item.language}</Text>
            </View>
          </View>
 
          {/* Divider */}
          <View style={styles.divider} />
 
          {/* Price row */}
          <View style={styles.priceRow}>
            {isFree ? (
              <View style={styles.freePriceBox}>
                <Text style={styles.freePriceText}>Free</Text>
              </View>
            ) : hasDiscount ? (
              <View style={styles.priceGroup}>
                <Text style={styles.discountPrice}>₹{item.discount_price}</Text>
                <Text style={styles.originalPrice}>₹{item.price}</Text>
              </View>
            ) : (
              <Text style={styles.paidPrice}>₹{item.price}</Text>
            )}
 
            <View style={styles.enrollBtn}>
              <Ionicons name="arrow-forward" size={13} color="#fff" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ---- CourseCardSmall (for continue learning) ----
export const CourseCardSmall = ({ course, onPress }) => (
  <TouchableOpacity
    style={styles.smallCard}
    onPress={onPress}
    activeOpacity={0.92}
  >
    <Image source={{ uri: course.thumbnail }} style={styles.smallThumb} />
    <View style={styles.smallInfo}>
      <Text style={styles.smallTitle} numberOfLines={2}>
        {course.title}
      </Text>
      <Text style={styles.smallInstructor}>{course.instructor}</Text>
      <View style={styles.progressBarOuter}>
        <View
          style={[styles.progressBarInner, { width: `${course.progress}%` }]}
        />
      </View>
      <Text style={styles.progressText}>{course.progress}% complete</Text>
    </View>
  </TouchableOpacity>
)

// ---- MentorCard ----
export const MentorCard = ({ mentor, onPress }) => (
  <TouchableOpacity
    style={styles.mentorCard}
    onPress={onPress}
    activeOpacity={0.92}
  >
    <Image source={{ uri: mentor.avatar }} style={styles.mentorAvatar} />
    <View style={styles.mentorOnline} />
    <Text style={styles.mentorName} numberOfLines={1}>
      {mentor.name}
    </Text>
    <Text style={styles.mentorExpertise} numberOfLines={1}>
      {mentor.expertise}
    </Text>
    <View style={styles.mentorRatingRow}>
      <Ionicons name="star" size={11} color={COLORS.star} />
      <Text style={styles.mentorRating}>{mentor.rating}</Text>
      <Text style={styles.mentorStudents}>
        {" "}
        · {(mentor.students / 1000).toFixed(0)}K
      </Text>
    </View>
    <TouchableOpacity style={styles.bookBtn} onPress={onPress}>
      <Text style={styles.bookBtnText}>Book Session</Text>
    </TouchableOpacity>
  </TouchableOpacity>
)

// ---- LiveClassCard ----
export const LiveClassCard = ({ cls, onPress }) => (
  <TouchableOpacity
    style={[styles.liveCard, { borderLeftColor: cls.color }]}
    onPress={onPress}
    activeOpacity={0.92}
  >
    <View style={[styles.liveBadge, { backgroundColor: cls.color }]}>
      <View style={styles.liveDot} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
    <Text style={styles.liveTitle} numberOfLines={2}>
      {cls.title}
    </Text>
    <Text style={styles.liveInstructor}>{cls.instructor}</Text>
    <View style={styles.liveMetaRow}>
      <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
      <Text style={styles.liveMeta}>
        {cls.time} · {cls.duration}
      </Text>
    </View>
    <View style={styles.liveMetaRow}>
      <Ionicons name="people-outline" size={12} color={COLORS.textSecondary} />
      <Text style={styles.liveMeta}>
        {cls.enrolled.toLocaleString()} enrolled
      </Text>
    </View>
  </TouchableOpacity>
)

// ---- TestCard ----
export const TestCard = ({ test, onPress }) => (
  <TouchableOpacity
    style={[styles.testCard, { borderTopColor: test.color }]}
    onPress={onPress}
    activeOpacity={0.92}
  >
    <View style={styles.testCardHeader}>
      <Text style={styles.testIcon}>{test.icon}</Text>
      <View
        style={[
          styles.difficultyBadge,
          {
            backgroundColor:
              test.difficulty === "Hard"
                ? "#FEE2E2"
                : test.difficulty === "Medium"
                  ? "#FEF3C7"
                  : "#DCFCE7"
          }
        ]}
      >
        <Text
          style={[
            styles.difficultyText,
            {
              color:
                test.difficulty === "Hard"
                  ? COLORS.error
                  : test.difficulty === "Medium"
                    ? COLORS.warning
                    : COLORS.success
            }
          ]}
        >
          {test.difficulty}
        </Text>
      </View>
    </View>
    <Text style={styles.testTitle} numberOfLines={2}>
      {test.title}
    </Text>
    <View style={styles.testMeta}>
      <Text style={styles.testMetaText}>📝 {test.questions} Questions</Text>
      <Text style={styles.testMetaText}>⏱ {test.duration}</Text>
    </View>
    <View style={styles.testProgress}>
      <Text style={styles.testProgressText}>
        {test.completed}/{test.totalTests} tests done
      </Text>
      <View style={styles.testProgressBar}>
        <View
          style={[
            styles.testProgressFill,
            {
              width: `${(test.completed / test.totalTests) * 100}%`,
              backgroundColor: test.color
            }
          ]}
        />
      </View>
    </View>
  </TouchableOpacity>
)

export const OpportunityChip = ({ item, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, isSelected && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
      {item.name}
    </Text>
  </TouchableOpacity>
);


// ---- SectionHeader ----
export const SectionHeader = ({ title, onSeeAll }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {onSeeAll && (
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={styles.seeAll}>See all</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ---- DoubtCard ----
export const DoubtCard = ({ doubt, onPress }) => (
  <TouchableOpacity
    style={styles.doubtCard}
    onPress={onPress}
    activeOpacity={0.92}
  >
    <View style={styles.doubtHeader}>
      <Image source={{ uri: doubt.avatar }} style={styles.doubtAvatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.doubtStudent}>{doubt.student}</Text>
        <Text style={styles.doubtTime}>{doubt.time}</Text>
      </View>
      <View
        style={[styles.subjectTag, { backgroundColor: COLORS.primaryLight }]}
      >
        <Text style={[styles.subjectTagText, { color: COLORS.primary }]}>
          {doubt.subject}
        </Text>
      </View>
    </View>
    <Text style={styles.doubtQuestion} numberOfLines={3}>
      {doubt.question}
    </Text>
    <View style={styles.doubtFooter}>
      <View style={styles.doubtStat}>
        <Ionicons name="heart-outline" size={14} color={COLORS.secondary} />
        <Text style={styles.doubtStatText}>{doubt.likes}</Text>
      </View>
      <View style={styles.doubtStat}>
        <Ionicons name="chatbubble-outline" size={14} color={COLORS.primary} />
        <Text style={styles.doubtStatText}>{doubt.answers} answers</Text>
      </View>
      {doubt.answered && (
        <View style={styles.answeredBadge}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
          <Text style={styles.answeredText}>Answered</Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
)

const styles = StyleSheet.create({

  // SmallCard
  smallCard: {
    width: width * 0.75,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginRight: 14,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden"
  },
  smallThumb: { width: 90, height: 90, backgroundColor: "#E5E7EB" },
  smallInfo: { flex: 1, padding: 10, justifyContent: "space-between" },
  smallTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 17
  },
  smallInstructor: { fontSize: 11, color: COLORS.textSecondary },
  progressBarOuter: {
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginTop: 6
  },
  progressBarInner: {
    height: 5,
    backgroundColor: COLORS.primary,
    borderRadius: 3
  },
  progressText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 3
  },

  // MentorCard
  mentorCard: {
    width: 150,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginRight: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4
  },
  mentorAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: COLORS.primaryLight
  },
  mentorOnline: {
    position: "absolute",
    top: 56,
    right: 38,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white
  },
  mentorName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center"
  },
  mentorExpertise: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 2
  },
  mentorRatingRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  mentorRating: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    marginLeft: 3
  },
  mentorStudents: { fontSize: 11, color: COLORS.textSecondary },
  bookBtn: {
    marginTop: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    width: "100%",
    alignItems: "center"
  },
  bookBtnText: { fontSize: 11, fontWeight: "700", color: COLORS.primary },

  // LiveClassCard
  liveCard: {
    width: 220,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginRight: 14,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 8,
    gap: 4
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5
  },
  liveTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 18
  },
  liveInstructor: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8
  },
  liveMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2
  },
  liveMeta: { fontSize: 11, color: COLORS.textSecondary },

  // TestCard
  testCard: {
    width: width * 0.72,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    borderTopWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4
  },
  testCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  testIcon: { fontSize: 28 },
  difficultyBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  difficultyText: { fontSize: 11, fontWeight: "700" },
  testTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
    lineHeight: 19
  },
  testMeta: { flexDirection: "row", gap: 14, marginBottom: 12 },
  testMetaText: { fontSize: 12, color: COLORS.textSecondary },
  testProgress: { gap: 5 },
  testProgressText: { fontSize: 11, color: COLORS.textSecondary },
  testProgressBar: {
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3
  },
  testProgressFill: { height: 5, borderRadius: 3 },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },

  seeAll: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  // DoubtCard
  doubtCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  doubtHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10
  },
  doubtAvatar: { width: 36, height: 36, borderRadius: 18 },
  doubtStudent: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  doubtTime: { fontSize: 11, color: COLORS.textLight },
  subjectTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  subjectTagText: { fontSize: 11, fontWeight: "700" },
  doubtQuestion: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 12
  },
  doubtFooter: { flexDirection: "row", alignItems: "center", gap: 14 },
  doubtStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  doubtStatText: { fontSize: 12, color: COLORS.textSecondary },
  answeredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto"
  },
  answeredText: { fontSize: 12, fontWeight: "600", color: COLORS.success },


  //Course Card
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
 
  // ── Thumbnail ──
  thumbWrap: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
 
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
 
  levelChip: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '600',
  },
 
  // ── Body ──
  body: {
    padding: 13,
    gap: 8,
  },
 
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
  },
 
  // Meta
  metaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
 
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
 
  // Price
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
 
  freePriceBox: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  freePriceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
 
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  discountPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  originalPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
 
  paidPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
 
  enrollBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
//Chip

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },

  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  chipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },

})

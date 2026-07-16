import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Linking,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../utils/dummyData';
import API from '../../utils/axiosInstanct';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

const STATS = [
  { label: 'Courses', value: '200+', icon: 'book-outline', color: '#6366F1' },
  { label: 'Students', value: '50K+', icon: 'people-outline', color: '#EC4899' },
  { label: 'Mentors', value: '100+', icon: 'star-outline', color: '#F59E0B' },
];

const CATEGORIES = [
  { label: 'Skill Courses', icon: 'book-outline', color: '#6366F1', bg: '#EEF2FF', route: 'Courses' },
  { label: 'Career Updates', icon: 'newspaper-outline', color: '#8B5CF6', bg: '#F5F3FF', route: 'AllBlogs' },
  { label: 'Opportunities', icon: 'briefcase-outline', color: '#10B981', bg: '#ECFDF5', route: 'Jobs' },
  { label: 'Build Resume', icon: 'clipboard-outline', color: '#F59E0B', bg: '#FFFBEB', route: 'ResumeBuilder' },
];

const formatEventDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const TAG_CONFIG = {
  Webinar: { grad: ['#6366F1', '#8B5CF6'], icon: 'videocam-outline' },
  Workshop: { grad: ['#EC4899', '#F43F5E'], icon: 'construct-outline' },
  'Hiring Drive': { grad: ['#10B981', '#059669'], icon: 'briefcase-outline' },
  Seminar: { grad: ['#F59E0B', '#EF4444'], icon: 'mic-outline' },
};

const getTagConfig = (tag) =>
  TAG_CONFIG[tag] || { grad: [COLORS.primary, COLORS.primary + 'CC'], icon: 'calendar-outline' };

// ─── Pulsing dot ───
const PulseDot = ({ color }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        width: 12, height: 12, borderRadius: 6,
        backgroundColor: color + '40',
        transform: [{ scale: pulse }],
        position: 'absolute',
      }} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
    </View>
  );
};


const BundleCTA = ({ onPress }) => {
  const glow = useRef(new Animated.Value(0)).current;
  const shine = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(shine, { toValue: 2, duration: 1800, useNativeDriver: true })
    ).start();
  }, []);

  const shadowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.7] });
  const translateX = shine.interpolate({ inputRange: [-1, 2], outputRange: [-220, 220] });

  return (
    <Animated.View style={[styles.bundleWrap, { shadowOpacity }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <LinearGradient
          colors={['#F59E0B', '#EF4444', '#EC4899']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.bundleBtn}
        >
          {/* shine sweep */}
          <Animated.View style={[styles.bundleShine, { transform: [{ translateX }, { rotate: '20deg' }] }]} />

          <View style={styles.bundleOff}>
            <Text style={styles.bundleOffText}>90%</Text>
            <Text style={styles.bundleOffSub}>OFF</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.bundleTitle}>Explore Bundle Courses</Text>
            <Text style={styles.bundleSub} numberOfLines={2}>
              Join multiple courses at a discount up to 90%
            </Text>
          </View>

          <View style={styles.bundleArrow}>
            <Ionicons name="arrow-forward" size={16} color="#EF4444" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};
const CategoryCard = ({ item, index, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, delay: index * 80, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPress={() => onPress(item)} style={styles.categoryCard} activeOpacity={0.8}>
        <View style={[styles.categoryIconBox, { backgroundColor: item.bg }]}>
          <Ionicons name={item.icon} size={20} color={item.color} />
        </View>
        <Text style={styles.categoryLabel} numberOfLines={2}>{item.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Event Card ───
const EventCard = ({ item, index }) => {
  const cfg = getTagConfig(item.tag);
  const isOnline = item.type === 'online';
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePress = () => {
    if (isOnline && item.link) Linking.openURL(item.link).catch(() => { });
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
      <View style={styles.eventCard}>
        {/* Gradient top strip */}
        <LinearGradient colors={cfg.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.eventStrip} />

        {/* Header */}
        <View style={styles.eventHeaderRow}>
          <LinearGradient colors={cfg.grad} style={styles.eventIconBox}>
            <Ionicons name={cfg.icon} size={14} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.eventTag}>{item.tag}</Text>
          </View>
          <View style={styles.onlineBadge}>
            <PulseDot color={isOnline ? '#10B981' : '#F59E0B'} />
            <Text style={[styles.onlineText, { color: isOnline ? '#10B981' : '#F59E0B' }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>

        {/* Meta row */}
        <View style={styles.eventMetaRow}>
          <View style={styles.eventMetaChip}>
            <Ionicons name="calendar-outline" size={11} color={cfg.grad[0]} />
            <Text style={styles.eventMetaText}>{formatEventDate(item.event_date)}</Text>
          </View>
          <View style={styles.eventMetaChip}>
            <Ionicons name={isOnline ? 'globe-outline' : 'location-outline'} size={11} color={cfg.grad[0]} />
            <Text style={styles.eventMetaText} numberOfLines={1}>
              {isOnline ? 'Virtual' : item.location}
            </Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
          <LinearGradient colors={cfg.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.eventBtn}>
            <Text style={styles.eventBtnText}>{item.btnText || 'Register Now'}</Text>
            <View style={styles.eventBtnArrow}>
              <Ionicons name="arrow-forward" size={11} color={cfg.grad[0]} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ─── Stat Card ───
const StatCard = ({ stat, index }) => {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, delay: index * 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay: index * 100, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.statCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.statIconBox, { backgroundColor: stat.color + '18' }]}>
        <Ionicons name={stat.icon} size={16} color={stat.color} />
      </View>
      <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </Animated.View>
  );
};

// ─── HomeHero ───
export default function HomeHero({ user, onExplore, onJoinLive, navigation }) {
  const [events, setEvents] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  // floating orb animations
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1, { toValue: -8, duration: 2500, useNativeDriver: true }),
        Animated.timing(orb1, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2, { toValue: 6, duration: 3000, useNativeDriver: true }),
        Animated.timing(orb2, { toValue: -6, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await API.get('/extra/get-app-events');
        setEvents(res.data?.data || []);
      } catch (e) { }
    };
    // fetchEvents();
  }, [user]);
  const handleCategoryPress = (item) => {
    navigation.navigate(item.route);
  };
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

      {/* ── HERO BANNER ── */}
      <View style={styles.heroBanner}>
        {/* Gradient bg */}
        <LinearGradient
          colors={['#4b1b1b', '#a42e2e', '#ca3838']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Floating orbs */}
        <Animated.View style={[styles.orb, styles.orb1, { transform: [{ translateY: orb1 }] }]} />
        <Animated.View style={[styles.orb, styles.orb2, { transform: [{ translateY: orb2 }] }]} />

        {/* Pattern dots */}
        <View style={styles.dotGrid} pointerEvents="none">
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={styles.dot} />
          ))}
        </View>

        {/* Content */}
        <View style={styles.heroContent}>
          <View style={styles.heroPill}>
            <View style={styles.heroPillDot} />
            <Text style={styles.heroPillText}>🎓 #1 Learning Platform</Text>
          </View>

          <Text style={styles.heroHeadline}>Unlock Your{'\n'}
            <Text style={styles.heroAccent}>Full Potential</Text>
          </Text>
          <Text style={styles.heroSub}>
            Courses, mentors & opportunities — all in one place
          </Text>

          {/* CTA Buttons */}
          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.ctaPrimary} onPress={onExplore} activeOpacity={0.85}>
              <LinearGradient
                colors={['#F59E0B', '#EF4444']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.ctaGrad}
              >
                <Ionicons name="compass-outline" size={15} color="#fff" />
                <Text style={styles.ctaPrimaryText}>Explore Courses</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ctaSecondary} onPress={() => navigation.navigate("Jobs")} activeOpacity={0.85}>
              <PulseDot color="#fff" />
              <Text style={styles.ctaSecondaryText}>Live Opportunities</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Floating badges */}
        <Animated.View style={[styles.floatBadge, styles.floatBadge1, { transform: [{ translateY: orb1 }] }]}>
          <Ionicons name="flash" size={12} color="#F59E0B" />
          <Text style={styles.floatBadgeText}>New Batch!</Text>
        </Animated.View>
        {/* 
        <Animated.View style={[styles.floatBadge, styles.floatBadge2, { transform: [{ translateY: orb2 }] }]}>
          <Ionicons name="trophy" size={12} color="#10B981" />
          <Text style={styles.floatBadgeText}>Top Rated</Text>
        </Animated.View> */}
      </View>
      <View style={styles.categoriesSection}>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.slice(0, 2).map((item, i) => (
            <CategoryCard onPress={(item) => handleCategoryPress(item)} key={item.label} item={item} index={i} />
          ))}
        </View>

        <BundleCTA onPress={() => navigation.navigate('BundleCoursesScreen')} />

        <View style={styles.categoriesGrid}>
          {CATEGORIES.slice(2).map((item, i) => (
            <CategoryCard onPress={(item) => handleCategoryPress(item)} key={item.label} item={item} index={i + 2} />
          ))}
        </View>
      </View>
      {/* ── STATS ROW ── */}
      {/* <View style={styles.statsRow}>
        {STATS.map((stat, i) => <StatCard key={stat.label} stat={stat} index={i} />)}
      </View> */}

      {/* ── EVENTS ── */}
      {events.length > 0 && (
        <View style={styles.eventsSection}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>✨ Upcoming Events</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{events.length}</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventsScroll}
            snapToInterval={CARD_WIDTH + 12}
            decelerationRate="fast"
          >
            {events.map((item, index) => (
              <EventCard key={item.id} item={item} index={index} />
            ))}
          </ScrollView>
        </View>
      )}
    </Animated.View>
  );
}

// ======================== STYLES ========================
const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 4,
  },

  // ── Hero ──
  heroBanner: {
    marginHorizontal: 6,
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 220,
  },

  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.25,
  },
  orb1: {
    width: 180,
    height: 180,
    backgroundColor: '#818CF8',
    top: -60,
    right: -40,
  },
  orb2: {
    width: 120,
    height: 120,
    backgroundColor: '#EC4899',
    bottom: -30,
    left: -20,
  },

  dotGrid: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 80,
    height: 80,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    opacity: 0.2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#fff',
  },

  heroContent: {
    padding: 20,
    paddingTop: 22,
    gap: 10,
    zIndex: 2,
  },

  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroPillDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  heroPillText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  heroHeadline: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heroAccent: {
    color: '#FCD34D',
  },

  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },

  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  ctaPrimary: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  ctaGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  ctaPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  ctaSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  ctaSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  // Floating badges
  floatBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 3,
  },
  floatBadge1: { top: 20, right: 16 },
  floatBadge2: { bottom: 20, right: 16 },
  floatBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1e1b4b',
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 6,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  statIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },

  // ── Events ──
  eventsSection: {
    gap: 10,
    paddingHorizontal: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  eventsScroll: {
    gap: 12,
    paddingRight: 4,
    paddingBottom: 4,
  },

  // Event Card
  eventCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 14,
    gap: 10,
    elevation: 3,
    shadowColor: '#6366F1',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  eventStrip: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 3,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  eventIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.2,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  eventDesc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
  },
  eventMetaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  eventMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flex: 1,
  },
  eventMetaText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  eventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingVertical: 11,
    paddingLeft: 14,
    paddingRight: 10,
  },
  eventBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  eventBtnArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesSection: {
    paddingHorizontal: 18,
    gap: 10,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: (width - 40 - 20) / 2,
    backgroundColor: '#fff',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 8,
    elevation: 0.5,
    shadowColor: '#000',
    shadowOpacity: 0.006,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  categoryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 14,
  },
  bundleWrap: {
    marginTop: 4,
    borderRadius: 16,
    shadowColor: '#EF4444',
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  bundleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  bundleShine: {
    position: 'absolute',
    top: -20,
    width: 60,
    height: 140,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  bundleOff: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bundleOffText: { fontSize: 17, fontWeight: '900', color: '#fff', lineHeight: 19 },
  bundleOffSub: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  bundleTitle: { fontSize: 14.5, fontWeight: '900', color: '#fff', letterSpacing: -0.2 },
  bundleSub: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 2, lineHeight: 15 },
  bundleArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  RefreshControl,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuthStore from '../../store/useAuthStore';
import { AuthWarn, Loader } from '../../components/LoadingAndAuthWarn';
import API from '../../utils/axiosInstanct';
import { COLORS } from '../../utils/dummyData';
import { CourseCard, OpportunityChip, SectionHeader } from '../../components/Reuseable';
import HomeHero from '../../components/HomeComponents/HomeHero';
import JobCard from '../../components/HomeComponents/JobCard';
import ResumeFab from './ResumeFab';
import BlogsComponent from './BlogsComponent';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// ─── Skeleton loader for jobs ───
const JobSkeleton = () => {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
  return (
    <Animated.View style={[skeletonStyles.card, { opacity }]}>
      <View style={skeletonStyles.logo} />
      <View style={{ flex: 1, gap: 7 }}>
        <View style={skeletonStyles.line} />
        <View style={[skeletonStyles.line, { width: '60%' }]} />
        <View style={[skeletonStyles.line, { width: '80%' }]} />
      </View>
    </Animated.View>
  );
};

const skeletonStyles = StyleSheet.create({
  card: {
    width: 220,
    height: 90,
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    marginRight: 12,
  },
  logo: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#D1D5DB' },
  line: { height: 10, borderRadius: 6, backgroundColor: '#D1D5DB', width: '100%' },
});

export default function HomeScreen({ navigation }) {
  const { user, isLoading: authLoading, isAuthenticated, student, fetchProfile } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [oppLoading, setOppLoading] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const searchScale = useRef(new Animated.Value(1)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const onSearchFocus = () => {
    setSearchFocused(true);
    Animated.spring(searchScale, { toValue: 1.02, friction: 6, useNativeDriver: true }).start();
  };
  const onSearchBlur = () => {
    setSearchFocused(false);
    Animated.spring(searchScale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning ☀️';
    if (hour < 17) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  }, []);

  const fetchFeaturedCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const res = await API.get('/extra/home-learning-course?featured=true&limit=10');
      if (res.data?.success) setFeaturedCourses(res.data.data);
    } catch (e) { console.error(e); }
    finally { setCoursesLoading(false); }
  }, []);

  const avatarUri = student?.photo ? `https://api.epinfoways.com/${student?.photo}` :
    user?.avatarUrl?.replace("/svg", "/png") ||
    "https://i.pravatar.cc/150?img=3";

  const fetchOpportunities = useCallback(async () => {
    setOppLoading(true);
    setJobsLoading(true);
    try {
      const [categoryRes, jobsRes] = await Promise.all([
        API.get('/job/category'),
        API.get('/job/get'),
      ]);
      if (categoryRes.data?.success) setOpportunities(categoryRes.data.data);
      if (jobsRes.data?.success) setJobs(jobsRes.data.data);
      else setJobs([]);
    } catch (e) {
      setJobs([]);
      setOpportunities([]);
    } finally {
      setOppLoading(false);
      setJobsLoading(false);
    }
  }, []);


  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchFeaturedCourses();
      fetchOpportunities();
      return () => {
        // Optional cleanup
      };
    }, [])
  );


  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        fetchFeaturedCourses(),
        fetchOpportunities(),
      ]);
    } catch (e) {
      console.log(e);
    } finally {
      setRefreshing(false);
    }
  }, [fetchFeaturedCourses, fetchOpportunities]);
  if (authLoading) return <Loader message="Please wait..." />;
  if (!isAuthenticated) {
    return (
      <AuthWarn
        title="Session Expired"
        message="Your login session has expired. Please sign in again."
        onLoginPress={() => navigation.navigate('Login')}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── HEADER ── */}
      <LinearGradient
        colors={['#4b1b1b', '#812e2e', '#ca3838']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        {/* Decorative orb */}
        <View style={styles.headerOrb} />

        <Animated.View style={[styles.headerTop, { opacity: headerAnim }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName}>{user?.name || 'Student'} 👋</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={20} color="#fff" />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarWrap}>
              <Image
                source={{ uri: avatarUri || 'https://i.pravatar.cc/150?img=3' }}
                style={styles.avatar}
              />
              <View style={styles.avatarOnline} />
            </TouchableOpacity>
          </View>
        </Animated.View>


      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
            progressBackgroundColor="#fff"
          />
        }
      >
        {/* Hero */}
        <HomeHero
          navigation={navigation}
          user={user}
          onExplore={() => navigation.navigate('Courses')}
          onJoinLive={() => navigation.navigate('LiveClasses')}
        />

        {/* ── OPPORTUNITIES ── */}
        <View style={styles.section}>
          <SectionHeader
            title="🎯 Opportunities"
            onSeeAll={() => navigation.navigate('Jobs')}
          />
          {oppLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 12 }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {opportunities.map((item) => (
                <OpportunityChip
                  key={item.id}
                  item={item}
                  isSelected={selectedOpp === item.id}
                  onPress={() => {
                    setSelectedOpp(item.id);
                    navigation.navigate('Jobs', { id: item.id, categorySlug: item.slug, categoryName: item.name });
                  }}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── FEATURED COURSES ── */}
        <View style={styles.section}>
          <SectionHeader
            title="⭐ Featured Courses"
            onSeeAll={() => navigation.navigate('Courses')}
          />
          {coursesLoading ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loaderText}>Loading courses...</Text>
            </View>
          ) : featuredCourses.length === 0 ? (
            <View style={styles.emptyBox}>
              <LinearGradient colors={['#F3F4F6', '#E5E7EB']} style={styles.emptyIconBox}>
                <Ionicons name="book-outline" size={28} color="#9CA3AF" />
              </LinearGradient>
              <Text style={styles.emptyText}>No courses available</Text>
            </View>
          ) : (
            <FlatList
              data={featuredCourses}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <CourseCard
                  item={item}
                  onPress={() => navigation.navigate('CourseDetail', { courseId: item.id, userId: user.id })}
                />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.courseList}
              snapToInterval={width * 0.72 + 12}
              decelerationRate="fast"
            />
          )}
        </View>

        {/* ── JOBS ── */}
        {(jobsLoading || (jobs && jobs.length > 0)) && (
          <View style={styles.section}>
            <SectionHeader
              title="💼 Latest Opportunities"
              onSeeAll={() => navigation.navigate('Jobs')}
            />

            {jobsLoading ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.jobList}
              >
                {[1, 2, 3].map((i) => <JobSkeleton key={i} />)}
              </ScrollView>
            ) : (
              <FlatList
                data={jobs.slice(0, 5)}
                keyExtractor={(item) => item.slug}
                renderItem={({ item }) => (
                  <JobCard
                    item={item}
                    onPress={() => navigation.navigate('JobDetail', { slug: item.slug })}
                  />
                )}
                ListFooterComponent={
                  <TouchableOpacity
                    style={styles.viewAllCard}
                    onPress={() => navigation.navigate('Jobs')}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#EEF2FF', '#E0E7FF']}
                      style={styles.viewAllGrad}
                    >
                      <View style={styles.viewAllIconBox}>
                        <Ionicons name="briefcase-outline" size={22} color={COLORS.primary} />
                      </View>
                      <Text style={styles.viewAllText}>View All</Text>
                      <Text style={styles.viewAllSub}>Jobs</Text>
                      <View style={styles.viewAllArrow}>
                        <Ionicons name="arrow-forward" size={12} color="#fff" />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                }
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.jobList}
                snapToInterval={240 + 12}
                decelerationRate="fast"
              />
            )}
          </View>
        )}

        <BlogsComponent />
        <View style={{ height: 32 }} />
      </ScrollView>
      <ResumeFab
        onPress={() => navigation.navigate('ResumeBuilder')}
      />
    </View>
  );
}

// ======================== STYLES ========================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ── Header ──
  header: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  headerOrb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -50,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: '#312e81',
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarOnline: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#312e81',
  },

  // Search
  searchWrap: {},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    paddingVertical: 0,
    fontWeight: '500',
  },

  // Layout
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 24,
    gap: 4,
  },
  section: {
    gap: 2,
    marginBottom: 4,
  },

  // Chips
  chipsRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },

  // Courses
  courseList: {
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 4,
  },

  // Jobs
  jobList: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
  },

  // View All card
  viewAllCard: {
    width: 120,
    height: 160,

    borderRadius: 14,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  viewAllGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
    minHeight: 130,
  },
  viewAllIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.2,
  },
  viewAllSub: {
    fontSize: 10,
    color: COLORS.primary,
    opacity: 0.65,
  },
  viewAllArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  // Loader / Empty
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  loaderText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  TextInput,
  ActivityIndicator,
  RefreshControl
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  COLORS,
  testSeries,
  mentors,
  doubts,
  notifications,
  quizQuestions
} from "../../utils/dummyData"
import { DoubtCard } from "../../components/Reuseable"
import API from "../../utils/axiosInstanct"
import { useEffect } from "react"

const { width } = Dimensions.get("window")

// ---- TESTS SCREEN ----
export function TestsScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={[extraStyles.pageHeader, { paddingTop: insets.top + 10 }]}>
        <Text style={extraStyles.pageTitle}>Test Series</Text>
        <View style={extraStyles.pageSubRow}>
          <Text style={extraStyles.pageSub}>Sharpen your exam skills</Text>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {/* Stats */}
        <View style={extraStyles.testStatsRow}>
          {[
            ["🎯", "32", "Tests Taken"],
            ["✅", "28", "Completed"],
            ["📊", "78%", "Avg Score"]
          ].map(([icon, val, label]) => (
            <View key={label} style={extraStyles.testStat}>
              <Text style={extraStyles.testStatIcon}>{icon}</Text>
              <Text style={extraStyles.testStatVal}>{val}</Text>
              <Text style={extraStyles.testStatLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Test Cards */}
        {testSeries.map(test => (
          <TouchableOpacity
            key={test.id}
            style={[extraStyles.testFullCard, { borderLeftColor: test.color }]}
            onPress={() => navigation.navigate("TestAttempt", { test })}
          >
            <View style={extraStyles.testFullHeader}>
              <Text style={extraStyles.testFullIcon}>{test.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={extraStyles.testFullTitle} numberOfLines={2}>
                  {test.title}
                </Text>
                <Text style={extraStyles.testFullSub}>
                  {test.subject} · {test.questions} Questions · {test.duration}
                </Text>
              </View>
              <View
                style={[
                  extraStyles.diffBadge,
                  {
                    backgroundColor:
                      test.difficulty === "Hard" ? "#FEE2E2" : "#FEF3C7"
                  }
                ]}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color:
                      test.difficulty === "Hard" ? COLORS.error : COLORS.warning
                  }}
                >
                  {test.difficulty}
                </Text>
              </View>
            </View>
            <View style={extraStyles.testFullMeta}>
              <View style={extraStyles.metaPill}>
                <Ionicons
                  name="people-outline"
                  size={12}
                  color={COLORS.textSecondary}
                />
                <Text style={extraStyles.metaPillText}>
                  {test.attempts.toLocaleString()} attempts
                </Text>
              </View>
              <View style={extraStyles.metaPill}>
                <Ionicons name="star" size={12} color={COLORS.star} />
                <Text style={extraStyles.metaPillText}>{test.rating}</Text>
              </View>
            </View>
            <View style={extraStyles.testProgress}>
              <Text style={extraStyles.testProgressText}>
                {test.completed}/{test.totalTests} tests completed
              </Text>
              <View style={extraStyles.testProgressBar}>
                <View
                  style={[
                    extraStyles.testProgressFill,
                    {
                      width: `${(test.completed / test.totalTests) * 100}%`,
                      backgroundColor: test.color
                    }
                  ]}
                />
              </View>
            </View>
            <TouchableOpacity
              style={[
                extraStyles.startTestBtn,
                { backgroundColor: test.color }
              ]}
              onPress={() => navigation.navigate("TestAttempt", { test })}
            >
              <Text style={extraStyles.startTestBtnText}>
                {test.completed === 0 ? "🚀 Start Test" : "▶ Continue"}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

// ---- TEST ATTEMPT SCREEN ----
export function TestAttemptScreen({ navigation, route }) {
  const { test } = route.params
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState(
    new Array(quizQuestions.length).fill(null)
  )
  const [submitted, setSubmitted] = useState(false)
  const insets = useSafeAreaInsets()

  const selectAnswer = optIdx => {
    const newAnswers = [...answers]
    newAnswers[current] = optIdx
    setAnswers(newAnswers)
  }

  const score = answers.filter((a, i) => a === quizQuestions[i]?.correct).length

  if (submitted) {
    return (
      <View style={[extraStyles.resultScreen, { paddingTop: insets.top }]}>
        <View style={extraStyles.resultCard}>
          <Text style={{ fontSize: 60 }}>🏆</Text>
          <Text style={extraStyles.resultTitle}>Test Completed!</Text>
          <Text style={extraStyles.resultSubtitle}>{test.title}</Text>
          <View style={extraStyles.scoreCircle}>
            <Text style={extraStyles.scoreNum}>{score * 4}</Text>
            <Text style={extraStyles.scoreTotal}>
              /{quizQuestions.length * 4}
            </Text>
          </View>
          <View style={extraStyles.resultStats}>
            {[
              ["✅", `${score}/${quizQuestions.length}`, "Correct"],
              ["⏱", "18:42", "Time Taken"],
              ["🏅", `#1240`, "Your Rank"]
            ].map(([icon, val, label]) => (
              <View key={label} style={extraStyles.resultStat}>
                <Text style={extraStyles.resultStatIcon}>{icon}</Text>
                <Text style={extraStyles.resultStatVal}>{val}</Text>
                <Text style={extraStyles.resultStatLabel}>{label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={extraStyles.reviewBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={extraStyles.reviewBtnText}>View Solutions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={extraStyles.homeBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={extraStyles.homeBtnText}>Back to Tests</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const q = quizQuestions[current]

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View style={[extraStyles.testHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={extraStyles.testHeaderTitle}>
            {test.title.slice(0, 30)}...
          </Text>
          <Text style={extraStyles.testHeaderSub}>
            Q{current + 1} of {quizQuestions.length}
          </Text>
        </View>
        <View style={extraStyles.timerChip}>
          <Ionicons name="timer-outline" size={14} color={COLORS.secondary} />
          <Text style={extraStyles.timerText}>45:00</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={extraStyles.testProgressBarOuter}>
        <View
          style={[
            extraStyles.testProgressBarFill,
            { width: `${((current + 1) / quizQuestions.length) * 100}%` }
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View style={extraStyles.qCard}>
          <View style={extraStyles.qNumBadge}>
            <Text style={extraStyles.qNumText}>Q{current + 1}</Text>
          </View>
          <Text style={extraStyles.qText}>{q.question}</Text>
        </View>

        {q.options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={[
              extraStyles.optCard,
              answers[current] === i && extraStyles.optCardSelected
            ]}
            onPress={() => selectAnswer(i)}
          >
            <View
              style={[
                extraStyles.optLetter,
                answers[current] === i && { backgroundColor: COLORS.primary }
              ]}
            >
              <Text
                style={[
                  extraStyles.optLetterText,
                  answers[current] === i && { color: "#fff" }
                ]}
              >
                {["A", "B", "C", "D"][i]}
              </Text>
            </View>
            <Text
              style={[
                extraStyles.optText,
                answers[current] === i && {
                  color: COLORS.primary,
                  fontWeight: "700"
                }
              ]}
            >
              {opt}
            </Text>
            {answers[current] === i && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={COLORS.primary}
                style={{ marginLeft: "auto" }}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Nav */}
      <View
        style={[
          extraStyles.testBottomNav,
          { paddingBottom: insets.bottom + 8 }
        ]}
      >
        <TouchableOpacity
          style={extraStyles.prevBtn}
          onPress={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color={current === 0 ? COLORS.textLight : COLORS.primary}
          />
          <Text
            style={[
              extraStyles.prevBtnText,
              current === 0 && { color: COLORS.textLight }
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={extraStyles.skipBtn}
          onPress={() =>
            setCurrent(Math.min(quizQuestions.length - 1, current + 1))
          }
        >
          <Text style={extraStyles.skipBtnText}>Skip</Text>
        </TouchableOpacity>

        {current === quizQuestions.length - 1 ? (
          <TouchableOpacity
            style={extraStyles.submitTestBtn}
            onPress={() => setSubmitted(true)}
          >
            <Text style={extraStyles.submitTestText}>Submit Test</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={extraStyles.nextBtn}
            onPress={() =>
              setCurrent(Math.min(quizQuestions.length - 1, current + 1))
            }
          >
            <Text style={extraStyles.nextBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}



// ---- MENTOR PROFILE ----
export function MentorProfileScreen({ navigation, route }) {
  const { mentor } = route.params
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Banner */}
        <View
          style={[extraStyles.mentorBanner, { paddingTop: insets.top + 10 }]}
        >
          <TouchableOpacity
            style={extraStyles.mentorBackBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: mentor.avatar }}
            style={extraStyles.mentorBigAvatar}
          />
          <Text style={extraStyles.mentorBigName}>{mentor.name}</Text>
          <Text style={extraStyles.mentorBigExpertise}>{mentor.expertise}</Text>
          <View style={extraStyles.mentorStatsRow}>
            {[
              [mentor.rating.toString(), "Rating"],
              [`${(mentor.students / 1000).toFixed(0)}K`, "Students"],
              [mentor.courses.toString(), "Courses"]
            ].map(([v, l]) => (
              <View key={l} style={extraStyles.mentorStat}>
                <Text style={extraStyles.mentorStatVal}>{v}</Text>
                <Text style={extraStyles.mentorStatLabel}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={extraStyles.mentorCard}>
          <Text style={extraStyles.mentorCardTitle}>About</Text>
          <Text style={extraStyles.mentorBio}>{mentor.bio}</Text>

          <Text style={[extraStyles.mentorCardTitle, { marginTop: 16 }]}>
            Experience
          </Text>
          <View style={extraStyles.expRow}>
            <Ionicons
              name="briefcase-outline"
              size={16}
              color={COLORS.primary}
            />
            <Text style={extraStyles.expText}>
              {mentor.experience} of teaching experience
            </Text>
          </View>

          <Text style={[extraStyles.mentorCardTitle, { marginTop: 16 }]}>
            Expertise Tags
          </Text>
          <View style={extraStyles.tagsRowFull}>
            {mentor.tags.map(tag => (
              <View key={tag} style={extraStyles.tagFull}>
                <Text style={extraStyles.tagFullText}>{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={[extraStyles.mentorCardTitle, { marginTop: 16 }]}>
            Session Details
          </Text>
          <View style={extraStyles.sessionCard}>
            <Text style={{ fontSize: 24 }}>🎓</Text>
            <View style={{ flex: 1 }}>
              <Text style={extraStyles.sessionTitle}>
                1-on-1 Mentorship Session
              </Text>
              <Text style={extraStyles.sessionDuration}>
                60 minutes · Online via Video Call
              </Text>
            </View>
            <Text style={extraStyles.sessionPrice}>₹{mentor.sessionPrice}</Text>
          </View>
        </View>
      </ScrollView>

      <View
        style={[extraStyles.mentorCTA, { paddingBottom: insets.bottom + 12 }]}
      >
        <View>
          <Text style={extraStyles.sessionPriceBig}>
            ₹{mentor.sessionPrice}
          </Text>
          <Text style={extraStyles.sessionPriceSub}>per session</Text>
        </View>
        <TouchableOpacity style={extraStyles.bookSessionBtn}>
          <Ionicons name="calendar-outline" size={18} color="#fff" />
          <Text style={extraStyles.bookSessionText}>Book a Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ---- COMMUNITY SCREEN ----
export function CommunityScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [askText, setAskText] = useState("")

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={[extraStyles.pageHeader, { paddingTop: insets.top + 10 }]}>
        <Text style={extraStyles.pageTitle}>Community Doubts</Text>
        <Text style={extraStyles.pageSub}>Ask, answer, and learn together</Text>
      </View>

      {/* Ask a Doubt */}
      <View style={extraStyles.askBox}>
        <TextInput
          style={extraStyles.askInput}
          placeholder="Ask your doubt here..."
          placeholderTextColor={COLORS.textLight}
          value={askText}
          onChangeText={setAskText}
          multiline
        />
        <TouchableOpacity style={extraStyles.askBtn}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Subject Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={extraStyles.filterRow}
      >
        {["All", "Physics", "Math", "Chemistry", "Biology", "Coding"].map(f => (
          <TouchableOpacity
            key={f}
            style={[
              extraStyles.filterChip,
              f === "All" && extraStyles.filterChipActive
            ]}
          >
            <Text
              style={[
                extraStyles.filterChipText,
                f === "All" && extraStyles.filterChipTextActive
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={doubts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <DoubtCard doubt={item} onPress={() => { }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

// ---- NOTIFICATIONS SCREEN ----
export function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/extra/notification");

      setNotifications(res.data.data || []);
    } catch (error) {
      console.log(error?.response?.data || error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/extra/notification/read/${id}`);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
              ...item,
              is_read: 1,
            }
            : item
        )
      );
    } catch (error) {
      console.log(error);
    }
  };

  const markAllRead = async () => {
    try {
      await API.put("/extra/notification/read-all");

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: 1,
        }))
      );
    } catch (error) {
      console.log(error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await API.delete(`/extra/notification/${id}`);

      setNotifications((prev) =>
        prev.filter((item) => item.id !== id)
      );
    } catch (error) {
      console.log(error);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        if (!item.is_read) {
          markAsRead(item.id);
        }
      }}
    >
      <View
        style={[
          extraStyles.notifCard,
          !item.is_read && extraStyles.notifCardUnread,
        ]}
      >
        <View
          style={[
            extraStyles.notifIcon,
            {
              backgroundColor: item.is_read
                ? COLORS.bg
                : COLORS.primaryLight,
            },
          ]}
        >
          <Ionicons
            name="notifications"
            size={22}
            color={COLORS.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <View style={extraStyles.notifTitleRow}>
            <Text style={extraStyles.notifTitle}>
              {item.title}
            </Text>

            {!item.is_read && (
              <View style={extraStyles.unreadDot} />
            )}
          </View>

          <Text
            style={extraStyles.notifMsg}
            numberOfLines={2}
          >
            {item.message}
          </Text>

          <Text style={extraStyles.notifTime}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => deleteNotification(item.id)}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color="#999"
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.bg,
      }}
    >
      <View
        style={[
          extraStyles.pageHeader,
          {
            paddingTop: insets.top + 10,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <Text style={extraStyles.pageTitle}>
          Notifications
        </Text>

        <TouchableOpacity onPress={markAllRead}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: COLORS.primary,
            }}
          >
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
          }}
        >
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          ListEmptyComponent={() => (
            <View
              style={{
                marginTop: 120,
                alignItems: "center",
              }}
            >
              <Ionicons
                name="notifications-off-outline"
                size={70}
                color="#bbb"
              />

              <Text
                style={{
                  marginTop: 15,
                  fontSize: 17,
                  fontWeight: "600",
                }}
              >
                No Notifications
              </Text>

              <Text
                style={{
                  marginTop: 5,
                  color: "#888",
                }}
              >
                You're all caught up.
              </Text>
            </View>
          )}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 100,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}


const extraStyles = StyleSheet.create({
  pageHeader: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
    width: "100%"
  },
  pageSubRow: {},
  pageSub: { fontSize: 13, color: COLORS.textSecondary },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },

  // Tests
  testStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3
  },
  testStat: { alignItems: "center", gap: 4 },
  testStatIcon: { fontSize: 24 },
  testStatVal: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  testStatLabel: { fontSize: 11, color: COLORS.textSecondary },
  testFullCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3
  },
  testFullHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12
  },
  testFullIcon: { fontSize: 32 },
  testFullTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
    lineHeight: 21
  },
  testFullSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  diffBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  testFullMeta: { flexDirection: "row", gap: 10, marginBottom: 12 },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  metaPillText: { fontSize: 12, color: COLORS.textSecondary },
  testProgress: { gap: 6, marginBottom: 14 },
  testProgressText: { fontSize: 12, color: COLORS.textSecondary },
  testProgressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3
  },
  testProgressFill: { height: 6, borderRadius: 3 },
  startTestBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  startTestBtnText: { fontSize: 14, fontWeight: "800", color: "#fff" },

  // Test Attempt
  testHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  testHeaderTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    maxWidth: width * 0.5,
    textAlign: "center"
  },
  testHeaderSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center"
  },
  timerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF0F3",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  timerText: { fontSize: 13, fontWeight: "700", color: COLORS.secondary },
  testProgressBarOuter: { height: 4, backgroundColor: COLORS.border },
  testProgressBarFill: { height: 4, backgroundColor: COLORS.primary },
  qCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3
  },
  qNumBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 10
  },
  qNumText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  qText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 23
  },
  optCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border
  },
  optCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight
  },
  optLetter: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border
  },
  optLetterText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textSecondary
  },
  optText: { flex: 1, fontSize: 14, color: COLORS.text },
  testBottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  prevBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  prevBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.primary },
  skipBtn: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  skipBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  nextBtnText: { fontSize: 14, fontWeight: "800", color: "#fff" },
  submitTestBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  submitTestText: { fontSize: 14, fontWeight: "800", color: "#fff" },

  // Result
  resultScreen: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    width: "100%",
    gap: 10
  },
  resultTitle: { fontSize: 26, fontWeight: "900", color: COLORS.text },
  resultSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center"
  },
  scoreCircle: {
    flexDirection: "row",
    alignItems: "baseline",
    marginVertical: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 16
  },
  scoreNum: { fontSize: 48, fontWeight: "900", color: COLORS.primary },
  scoreTotal: { fontSize: 22, fontWeight: "600", color: COLORS.textSecondary },
  resultStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: 8
  },
  resultStat: { alignItems: "center", gap: 4 },
  resultStatIcon: { fontSize: 22 },
  resultStatVal: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  resultStatLabel: { fontSize: 11, color: COLORS.textSecondary },
  reviewBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: "100%",
    alignItems: "center"
  },
  reviewBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
  homeBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 28,
    width: "100%",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border
  },
  homeBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.textSecondary },

  // Mentors
  mentorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3
  },
  mentorRowAvatar: { width: 64, height: 64, borderRadius: 32 },
  mentorRowName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  mentorRowExpertise: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4
  },
  mentorRowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 6
  },
  mentorRowRating: { fontSize: 12, fontWeight: "700", color: COLORS.text },
  mentorRowStudents: { fontSize: 11, color: COLORS.textSecondary },
  tagsRow: { flexDirection: "row", gap: 6 },
  tag: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  tagText: { fontSize: 10, fontWeight: "600", color: COLORS.primary },
  bookMiniBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  bookMiniBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  // Mentor Profile
  mentorBanner: {
    backgroundColor: COLORS.primary,
    alignItems: "center",
    paddingBottom: 30,
    paddingHorizontal: 20
  },
  mentorBackBtn: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center"
  },
  mentorBigAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.5)",
    marginBottom: 12
  },
  mentorBigName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 4
  },
  mentorBigExpertise: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 16
  },
  mentorStatsRow: { flexDirection: "row", gap: 28 },
  mentorStat: { alignItems: "center" },
  mentorStatVal: { fontSize: 18, fontWeight: "900", color: "#fff" },
  mentorStatLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  mentorCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3
  },
  mentorCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8
  },
  mentorBio: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  expRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  expText: { fontSize: 14, color: COLORS.text },
  tagsRowFull: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagFull: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7
  },
  tagFullText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 14
  },
  sessionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  sessionDuration: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  sessionPrice: { fontSize: 16, fontWeight: "900", color: COLORS.primary },
  mentorCTA: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  sessionPriceBig: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  sessionPriceSub: { fontSize: 12, color: COLORS.textSecondary },
  bookSessionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 13
  },
  bookSessionText: { fontSize: 15, fontWeight: "800", color: "#fff" },

  // Community
  askBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    marginTop: 12
  },
  askInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    maxHeight: 80
  },
  askBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center"
  },
  filterRow: { paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.border
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary
  },
  filterChipTextActive: { color: "#fff" },

  // Notifications
  notifCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginBottom: 10
  },
  notifCardUnread: { backgroundColor: COLORS.primaryLight + "80" },
  notifIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3
  },
  notifTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, flex: 1 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary
  },
  notifMsg: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 4
  },
  notifTime: { fontSize: 11, color: COLORS.textLight },

  // Profile
  profileHeader: {
    backgroundColor: COLORS.primary,
    alignItems: "center",
    paddingBottom: 30,
    paddingHorizontal: 20
  },
  profileAvatarWrap: { position: "relative", marginBottom: 12 },
  profileAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.5)"
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff"
  },
  profileName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 4
  },
  profileEmail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 10
  },
  profileBadge: {
    backgroundColor: COLORS.accentOrange,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5
  },
  profileBadgeText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  profileStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 14
  },
  profileStat: { alignItems: "center", gap: 4 },
  profileStatVal: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  profileStatLabel: { fontSize: 11, color: COLORS.textSecondary },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden"
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  menuLabel: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.textLight,
    paddingBottom: 10
  }
})

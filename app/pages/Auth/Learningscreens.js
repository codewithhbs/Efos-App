import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { COLORS, courses } from "../../utils/dummyData"

const { width } = Dimensions.get("window")

// ---- MY LEARNING ----
export function MyLearningScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState("all")
  const enrolledCourses = courses.filter(c => c.progress > 0)
  const filtered =
    tab === "all"
      ? enrolledCourses
      : tab === "inprogress"
      ? enrolledCourses.filter(c => c.progress < 100 && c.progress > 0)
      : enrolledCourses.filter(c => c.progress === 100)

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={[learnStyles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={learnStyles.title}>My Learning</Text>
        <TouchableOpacity style={learnStyles.searchIcon}>
          <Ionicons name="search-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={learnStyles.tabBar}>
        {["all", "inprogress", "completed"].map(t => (
          <TouchableOpacity
            key={t}
            style={[learnStyles.tab, tab === t && learnStyles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text
              style={[
                learnStyles.tabText,
                tab === t && learnStyles.tabTextActive
              ]}
            >
              {t === "all"
                ? "All"
                : t === "inprogress"
                ? "In Progress"
                : "Completed"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={learnStyles.learningCard}
            onPress={() =>
              navigation.navigate("LecturePlayer", { course: item })
            }
            activeOpacity={0.92}
          >
            <Image
              source={{ uri: item.thumbnail }}
              style={learnStyles.cardThumb}
            />
            <View style={learnStyles.cardBody}>
              <Text style={learnStyles.cardCat}>
                {item.category.toUpperCase()}
              </Text>
              <Text style={learnStyles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={learnStyles.cardInstructor}>{item.instructor}</Text>
              <View style={learnStyles.progressSection}>
                <View style={learnStyles.progressBar}>
                  <View
                    style={[
                      learnStyles.progressFill,
                      { width: `${item.progress}%` }
                    ]}
                  />
                </View>
                <Text style={learnStyles.progressPct}>{item.progress}%</Text>
              </View>
              <TouchableOpacity
                style={learnStyles.continueBtn}
                onPress={() =>
                  navigation.navigate("LecturePlayer", { course: item })
                }
              >
                <Ionicons name="play-circle" size={16} color="#fff" />
                <Text style={learnStyles.continueBtnText}>
                  Continue Learning
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={learnStyles.emptyState}>
            <Text style={{ fontSize: 52 }}>📚</Text>
            <Text style={learnStyles.emptyTitle}>No Courses Yet</Text>
            <Text style={learnStyles.emptySubtitle}>
              Start your learning journey by enrolling in a course
            </Text>
          </View>
        )}
      />
    </View>
  )
}

// ---- LECTURE PLAYER ----
export function LecturePlayerScreen({ navigation, route }) {
  const { course } = route.params
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState("lectures")
  const [currentLecture, setCurrentLecture] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const lectures = [
    {
      id: 1,
      module: "Module 1: Introduction",
      title: "Course Overview & Introduction",
      duration: "12:30",
      free: true
    },
    {
      id: 2,
      module: "Module 1: Introduction",
      title: "Fundamentals and Core Concepts",
      duration: "28:45",
      free: false
    },
    {
      id: 3,
      module: "Module 1: Introduction",
      title: "Problem Solving Approach",
      duration: "34:20",
      free: false
    },
    {
      id: 4,
      module: "Module 2: Core Topics",
      title: "Deep Dive: Part 1",
      duration: "42:15",
      free: false
    },
    {
      id: 5,
      module: "Module 2: Core Topics",
      title: "Deep Dive: Part 2",
      duration: "38:50",
      free: false
    },
    {
      id: 6,
      module: "Module 2: Core Topics",
      title: "Practice Session",
      duration: "55:30",
      free: false
    },
    {
      id: 7,
      module: "Module 3: Advanced",
      title: "Advanced Concepts",
      duration: "48:20",
      free: false
    },
    {
      id: 8,
      module: "Module 3: Advanced",
      title: "Mock Problems & Solutions",
      duration: "1:02:10",
      free: false
    }
  ]

  const playerTabs = ["lectures", "notes", "dpp", "assignment", "quiz"]

  return (
    <View style={{ flex: 1, backgroundColor: "#111" }}>
      {/* Video Player */}
      <View style={playerStyles.player}>
        <Image
          source={{ uri: course.thumbnail }}
          style={playerStyles.playerBg}
        />
        <View style={playerStyles.playerOverlay} />
        <TouchableOpacity
          style={playerStyles.backBtn2}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={playerStyles.playBtn2}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <Ionicons
            name={isPlaying ? "pause-circle" : "play-circle"}
            size={62}
            color="rgba(255,255,255,0.92)"
          />
        </TouchableOpacity>
        <View style={playerStyles.playerControls}>
          <View style={playerStyles.seekBar}>
            <View style={playerStyles.seekFill} />
          </View>
          <View style={playerStyles.controlsRow}>
            <Text style={playerStyles.timeText}>8:34</Text>
            <View style={playerStyles.controlBtns}>
              <Ionicons name="play-skip-back" size={20} color="#fff" />
              <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)}>
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
              <Ionicons name="play-skip-forward" size={20} color="#fff" />
            </View>
            <View style={playerStyles.controlRight}>
              <Ionicons name="expand-outline" size={18} color="#fff" />
            </View>
          </View>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        {/* Lecture Info */}
        <View style={playerStyles.lectureInfo}>
          <Text style={playerStyles.lectureTitle} numberOfLines={2}>
            {lectures[currentLecture]?.title}
          </Text>
          <Text style={playerStyles.lectureCourse}>{course.title}</Text>
          <View style={playerStyles.lectureMetaRow}>
            <View style={playerStyles.lectureMeta}>
              <Ionicons
                name="time-outline"
                size={13}
                color={COLORS.textSecondary}
              />
              <Text style={playerStyles.lectureMetaText}>
                {lectures[currentLecture]?.duration}
              </Text>
            </View>
            <TouchableOpacity
              style={playerStyles.nextLectureBtn}
              onPress={() =>
                setCurrentLecture(
                  Math.min(currentLecture + 1, lectures.length - 1)
                )
              }
            >
              <Text style={playerStyles.nextLectureText}>Next Lecture</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={playerStyles.tabScroll}
          contentContainerStyle={playerStyles.tabScrollContent}
        >
          {playerTabs.map(t => (
            <TouchableOpacity
              key={t}
              style={[
                playerStyles.tab,
                activeTab === t && playerStyles.tabActive
              ]}
              onPress={() => setActiveTab(t)}
            >
              <Text
                style={[
                  playerStyles.tabText,
                  activeTab === t && playerStyles.tabTextActive
                ]}
              >
                {t === "dpp" ? "DPP" : t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {activeTab === "lectures" && (
            <View style={playerStyles.lectureList}>
              {lectures
                .reduce((acc, lecture, idx) => {
                  if (
                    idx === 0 ||
                    lecture.module !== lectures[idx - 1].module
                  ) {
                    acc.push({
                      type: "module",
                      title: lecture.module,
                      key: `mod-${idx}`
                    })
                  }
                  acc.push({
                    ...lecture,
                    type: "lecture",
                    key: `lec-${lecture.id}`
                  })
                  return acc
                }, [])
                .map(item =>
                  item.type === "module" ? (
                    <View key={item.key} style={playerStyles.moduleHeader}>
                      <Text style={playerStyles.moduleName}>{item.title}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        playerStyles.lectureItem,
                        currentLecture === item.id - 1 &&
                          playerStyles.lectureItemActive
                      ]}
                      onPress={() => setCurrentLecture(item.id - 1)}
                    >
                      <View
                        style={[
                          playerStyles.lectureNum,
                          currentLecture === item.id - 1 && {
                            backgroundColor: COLORS.primary
                          }
                        ]}
                      >
                        {currentLecture === item.id - 1 ? (
                          <Ionicons name="play" size={12} color="#fff" />
                        ) : (
                          <Text style={playerStyles.lectureNumText}>
                            {item.id}
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            playerStyles.lectureName,
                            currentLecture === item.id - 1 && {
                              color: COLORS.primary
                            }
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text style={playerStyles.lectureDuration}>
                          {item.duration}
                        </Text>
                      </View>
                      {item.free && (
                        <View style={playerStyles.freeBadge}>
                          <Text style={playerStyles.freeText}>FREE</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                )}
            </View>
          )}

          {activeTab === "notes" && (
            <View style={playerStyles.contentArea}>
              <View style={playerStyles.pdfCard}>
                <View style={playerStyles.pdfIcon}>
                  <Text style={{ fontSize: 32 }}>📄</Text>
                </View>
                <View>
                  <Text style={playerStyles.pdfTitle}>
                    Lecture Notes - {lectures[currentLecture]?.title}
                  </Text>
                  <Text style={playerStyles.pdfSize}>
                    PDF · 2.4 MB · 18 pages
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={playerStyles.downloadBtn}>
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={playerStyles.downloadBtnText}>Download PDF</Text>
              </TouchableOpacity>
              <View style={playerStyles.pdfViewer}>
                <Ionicons
                  name="document-text-outline"
                  size={48}
                  color={COLORS.textLight}
                />
                <Text style={playerStyles.pdfViewerText}>
                  PDF Viewer Preview
                </Text>
                <Text
                  style={[
                    playerStyles.pdfViewerText,
                    { fontSize: 12, marginTop: 4 }
                  ]}
                >
                  Tap Download to open
                </Text>
              </View>
            </View>
          )}

          {activeTab === "dpp" && (
            <View style={playerStyles.contentArea}>
              <Text style={playerStyles.contentHeading}>
                Daily Practice Problems
              </Text>
              {[1, 2, 3, 4, 5].map(q => (
                <View key={q} style={playerStyles.questionCard}>
                  <Text style={playerStyles.questionNum}>Q{q}.</Text>
                  <Text style={playerStyles.questionText}>
                    {q === 1
                      ? "A ball is thrown vertically upward with velocity 20 m/s. Find the maximum height."
                      : q === 2
                      ? "Calculate the work done by friction when a 5 kg block slides 10 m on a rough surface (μ=0.3)."
                      : q === 3
                      ? "Two charges of +3μC and -4μC are placed 0.5 m apart. Find the force between them."
                      : q === 4
                      ? "A current of 2A flows through a 50Ω resistor for 10 seconds. Find the heat generated."
                      : "A lens of focal length 20 cm forms an image. Find the image distance if object is at 30 cm."}
                  </Text>
                  <View style={playerStyles.optionsGrid}>
                    {["(A) 20 m", "(B) 15.3 m", "(C) 18.5 m", "(D) 22 m"].map(
                      opt => (
                        <TouchableOpacity
                          key={opt}
                          style={playerStyles.optionBtn}
                        >
                          <Text style={playerStyles.optionText}>{opt}</Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>
              ))}
              <TouchableOpacity style={playerStyles.submitBtn}>
                <Text style={playerStyles.submitBtnText}>Submit DPP</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === "assignment" && (
            <View style={playerStyles.contentArea}>
              <Text style={playerStyles.contentHeading}>Assignment</Text>
              <View style={playerStyles.assignmentCard}>
                <View style={playerStyles.assignmentHeader}>
                  <Text style={{ fontSize: 24 }}>📝</Text>
                  <View>
                    <Text style={playerStyles.assignmentTitle}>
                      Week 3 Assignment
                    </Text>
                    <Text style={playerStyles.assignmentDeadline}>
                      ⏰ Due: Tomorrow, 11:59 PM
                    </Text>
                  </View>
                </View>
                <Text style={playerStyles.assignmentDesc}>
                  Complete the following 10 problems on the topic covered in
                  this week's lectures. Show all working.
                </Text>
              </View>
              <View style={playerStyles.uploadArea}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={40}
                  color={COLORS.primary}
                />
                <Text style={playerStyles.uploadTitle}>Upload Your Answer</Text>
                <Text style={playerStyles.uploadSub}>
                  Supported: PDF, JPG, PNG (Max 10MB)
                </Text>
                <TouchableOpacity style={playerStyles.uploadBtn}>
                  <Text style={playerStyles.uploadBtnText}>Choose File</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[
                  playerStyles.submitBtn,
                  { backgroundColor: COLORS.success }
                ]}
              >
                <Ionicons name="send-outline" size={16} color="#fff" />
                <Text style={playerStyles.submitBtnText}>
                  Submit Assignment
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === "quiz" && (
            <View style={playerStyles.contentArea}>
              <Text style={playerStyles.contentHeading}>Quick Quiz</Text>
              <Text style={playerStyles.quizSub}>
                Test your understanding · 5 questions
              </Text>
              <View style={playerStyles.quizTimerRow}>
                <Ionicons
                  name="timer-outline"
                  size={18}
                  color={COLORS.secondary}
                />
                <Text style={playerStyles.quizTimer}>Time Remaining: 4:30</Text>
              </View>
              {[1, 2, 3].map(q => (
                <View key={q} style={playerStyles.quizCard}>
                  <Text style={playerStyles.quizQ}>
                    Q{q}. Which of the following is a vector quantity?
                  </Text>
                  {["Speed", "Distance", "Displacement", "Mass"].map(
                    (opt, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          playerStyles.quizOption,
                          i === 2 && playerStyles.quizOptionSelected
                        ]}
                      >
                        <View
                          style={[
                            playerStyles.quizRadio,
                            i === 2 && playerStyles.quizRadioSelected
                          ]}
                        >
                          {i === 2 && (
                            <View style={playerStyles.quizRadioDot} />
                          )}
                        </View>
                        <Text
                          style={[
                            playerStyles.quizOptionText,
                            i === 2 && {
                              color: COLORS.primary,
                              fontWeight: "700"
                            }
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              ))}
              <TouchableOpacity style={playerStyles.submitBtn}>
                <Text style={playerStyles.submitBtnText}>Submit Quiz</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

const learnStyles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  title: { fontSize: 24, fontWeight: "900", color: COLORS.text },
  searchIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center"
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  tab: { flex: 1, paddingVertical: 13, alignItems: "center" },
  tabActive: { borderBottomWidth: 3, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: "800" },
  learningCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: "row"
  },
  cardThumb: { width: 100, height: 120, backgroundColor: COLORS.border },
  cardBody: { flex: 1, padding: 12 },
  cardCat: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 3
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 3,
    lineHeight: 18
  },
  cardInstructor: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 8
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10
  },
  progressBar: {
    flex: 1,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3
  },
  progressFill: { height: 5, backgroundColor: COLORS.primary, borderRadius: 3 },
  progressPct: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    minWidth: 32
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start"
  },
  continueBtnText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40
  }
})

const playerStyles = StyleSheet.create({
  player: {
    height: 220,
    position: "relative",
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center"
  },
  playerBg: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.6
  },
  playerOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  backBtn2: {
    position: "absolute",
    top: 12,
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5
  },
  playBtn2: { zIndex: 2 },
  playerControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingBottom: 10
  },
  seekBar: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    marginBottom: 8
  },
  seekFill: {
    height: 3,
    backgroundColor: COLORS.primary,
    width: "32%",
    borderRadius: 2
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  timeText: { color: "#fff", fontSize: 11, minWidth: 60 },
  controlBtns: { flexDirection: "row", alignItems: "center", gap: 20 },
  controlRight: { minWidth: 60, alignItems: "flex-end" },
  lectureInfo: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  lectureTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 3
  },
  lectureCourse: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  lectureMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  lectureMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  lectureMetaText: { fontSize: 12, color: COLORS.textSecondary },
  nextLectureBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  nextLectureText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  tabScroll: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 48
  },
  tabScrollContent: { paddingHorizontal: 10, gap: 4 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 3,
    borderBottomColor: "transparent"
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: "800" },
  lectureList: { backgroundColor: COLORS.white, marginTop: 8 },
  moduleHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  moduleName: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  lectureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  lectureItemActive: { backgroundColor: COLORS.primaryLight },
  lectureNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center"
  },
  lectureNumText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary
  },
  lectureName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2
  },
  lectureDuration: { fontSize: 11, color: COLORS.textSecondary },
  freeBadge: {
    backgroundColor: "#DCFCE7",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  freeText: { fontSize: 10, fontWeight: "700", color: COLORS.success },
  contentArea: { padding: 16 },
  contentHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4
  },
  pdfCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  pdfIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center"
  },
  pdfTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 3
  },
  pdfSize: { fontSize: 12, color: COLORS.textSecondary },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 14
  },
  downloadBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  pdfViewer: {
    height: 200,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    gap: 6
  },
  pdfViewerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "600"
  },
  questionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2
  },
  questionNum: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 4
  },
  questionText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 21,
    marginBottom: 12
  },
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionBtn: {
    width: (width - 80) / 2,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border
  },
  optionText: { fontSize: 13, color: COLORS.text, fontWeight: "600" },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  submitBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
  assignmentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  assignmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10
  },
  assignmentTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  assignmentDeadline: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: "600",
    marginTop: 2
  },
  assignmentDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  uploadArea: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    marginBottom: 14,
    gap: 8
  },
  uploadTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  uploadSub: { fontSize: 12, color: COLORS.textSecondary },
  uploadBtn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 9,
    marginTop: 4
  },
  uploadBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  quizSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 },
  quizTimerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF0F3",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    alignSelf: "flex-start"
  },
  quizTimer: { fontSize: 14, fontWeight: "700", color: COLORS.secondary },
  quizCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12
  },
  quizQ: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 21,
    marginBottom: 12
  },
  quizOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 8,
    backgroundColor: COLORS.bg
  },
  quizOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight
  },
  quizRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center"
  },
  quizRadioSelected: { borderColor: COLORS.primary },
  quizRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary
  },
  quizOptionText: { fontSize: 14, color: COLORS.text }
})

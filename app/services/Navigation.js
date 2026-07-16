import React from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { StyleSheet, Platform } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../utils/dummyData"

// Screens
import SplashScreen from "../screen/SplashScreen"
import OnboardingScreen from "../screen/OnboardingScreen"
import {
  LoginScreen,
  SignupScreen,
  OTPScreen,
  ForgotPasswordScreen
} from "../pages/Auth/Authscreens"
import HomeScreen from "../pages/Home/HomeScreen"
import { LecturePlayerScreen, MyLearningScreen } from "../pages/Auth/Learningscreens"
import { CommunityScreen, TestAttemptScreen, TestsScreen } from "../pages/extra/Extrascreens"
import { ProfileScreen } from "../pages/Profile/Profile"
import CourseDetails from "../pages/Course/CourseDetails"
import classroom from "../pages/Classroom/classroom"
import JobDetail from "../pages/JobDetails/JobDetail"
import StudentProfile from "../pages/Profile/StudentProfile"
import Test from "../pages/Profile/StudentProfile"
import MentorsScreen from "../pages/MentorsScreen/MentorsScreen"
import MentorDetails from "../pages/MentorsScreen/MentorDetails"
import BookSessionWithMentor from "../pages/MentorsScreen/BookSessionWithMentor"
import BookingSuccess from "../pages/MentorsScreen/BookingSuccess"
import MyCourseEnrolled from "../pages/EnrolledScreens/MyCourseEnrolled"
import BookedSessions from "../pages/EnrolledScreens/BookedSessions"
import MyAllApplications from "../pages/EnrolledScreens/MyAllApplications"
import MyPayments from "../pages/EnrolledScreens/MyPayments"
import SettingsScreen from "../pages/Profile/Settings"
import Coursescreens from "../pages/Course/Coursescreens"
import AllJobs from "../pages/JobDetails/AllJobs"
import ResumeBuilder from "../pages/ResumeBuilder/ResumeBuilder"
import AllQuizOfChapter from "../pages/QuizScreen/AllQuizOfChapter"
import QuizPlayScreen from "../pages/QuizScreen/QuizPlayScreen"
import AllBundleCourse from "../pages/BundleCourses/AllBundleCourse"
import BundleDetails from "../pages/BundleCourses/Bundledetails"
import MyBundleCourses from "../pages/BundleCourses/MyBundleCourses"
import { NotificationsScreen } from "../pages/extra/NotificationsScreen"
import AllBlogs from "../pages/Home/AllBlogs"
import DetailsBlogs from "../pages/Home/DetailsBlogs"


const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function TabBar() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "home"
          if (route.name === "Home")
            iconName = focused ? "home" : "home-outline"
          else if (route.name === "Courses")
            iconName = focused ? "book" : "book-outline"
          else if (route.name === "Mentors")
            iconName = focused ? "person" : "person-outline"
          else if (route.name === "Tests")
            iconName = focused ? "document-text" : "document-text-outline"
          else if (route.name === "Profile")
            iconName = focused ? "person" : "person-outline"
          return <Ionicons name={iconName} size={22} color={color} />
        }
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="Courses"
        component={Coursescreens}
        options={{ tabBarLabel: "Courses" }}
      />
      <Tab.Screen
        name="Mentors"
        component={MentorsScreen}
        options={{ tabBarLabel: "Mentors" }}
      />
      <Tab.Screen
        name="Tests"
        component={AllJobs}
        options={{ tabBarLabel: "Opportunity" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  )
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Splash"
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Main" component={TabBar} />
        <Stack.Screen
          name="CourseDetail"
          component={CourseDetails}
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="LecturePlayer"
          component={LecturePlayerScreen}
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="TestAttempt"
          component={TestAttemptScreen}
          options={{ presentation: "card" }}
        />
        <Stack.Screen name="Classroom" component={classroom} />
        <Stack.Screen name="StudentProfile" children={Test} />
        <Stack.Screen name="JobDetail" component={JobDetail} />
        <Stack.Screen name="Mentors" component={MentorsScreen} />
        <Stack.Screen name="MentorDetails" component={MentorDetails} />
        <Stack.Screen name="BookSessionWithMentor" component={BookSessionWithMentor} />
        <Stack.Screen name="BookingSuccess" component={BookingSuccess} />

        <Stack.Screen name="AllBlogs" component={AllBlogs} />
        <Stack.Screen name="DetailsBlogs" component={DetailsBlogs} />

{/* DetailsBlogs */}

        <Stack.Screen name="AllMyCourses" component={MyCourseEnrolled} />
        <Stack.Screen name="AllMentorsBookings" component={BookedSessions} />
        {/* applications */}
        <Stack.Screen name="applications" component={MyAllApplications} />
        
        {/* Payments */}

        <Stack.Screen name="Payments" component={MyPayments} />
        <Stack.Screen name="Jobs" component={AllJobs} />
        <Stack.Screen name="ResumeBuilder" component={ResumeBuilder} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="QuizScreen" component={AllQuizOfChapter} />
        <Stack.Screen name="QuizDetails" component={QuizPlayScreen} />



        {/* Bundle */}
        <Stack.Screen name="BundleCoursesScreen" component={AllBundleCourse} />
        <Stack.Screen name="BundleDetails" component={BundleDetails} />
        <Stack.Screen name="MyBundleCourses" component={MyBundleCourses} />



      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    height: Platform.OS === "ios" ? 85 : 75,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 25 : 20,
    marginBottom: Platform.OS === "android" ? 40 : 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2
  }
})

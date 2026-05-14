import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from "react-native";
import { COLORS, onboardingData } from "../utils/dummyData"; // Keep as fallback
import API from "../utils/axiosInstanct";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState([]);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const fetchSlides = async () => {
    try {
      const res = await API.get("/extra/onboard-slides");


      if (res.data?.success && res.data?.data?.length > 0) {
        // Clean the third item's broken image_url (remove duplicate)
        const cleanedSlides = res.data.data.map((slide, idx) => {
          if (idx === 2) {
            const urls = slide.image_url.split("https://");
            return {
              ...slide,
              image_url: urls.length > 1 ? "https://" + urls[1] : slide.image_url,
            };
          }
          return slide;
        });
        setSlides(cleanedSlides);
      } else {
        setSlides(onboardingData); // fallback
      }
    } catch (error) {
      console.error("Failed to fetch onboarding slides:", error);
      setSlides(onboardingData); // fallback on error
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace("Login");
    }
  };

  const skip = () => navigation.replace("Login");

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      {/* Image instead of emoji circle */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image_url }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Card */}
      <View style={[styles.card, { borderTopColor: item.gradient?.[0] || COLORS.primary }]}>
        <Text style={[styles.title, { color: item.gradient?.[0] || COLORS.primary }]}>
          {item.title}
        </Text>
        <Text style={styles.subtitle}>{item.description || item.subtitle}</Text>
      </View>
    </View>
  );

  // Use fetched slides or fallback
  const displaySlides = slides.length > 0 ? slides : onboardingData;

  return (
    <View style={styles.container}>
      {/* Top decorative background */}
      <View
        style={[
          styles.topDecor,
          { backgroundColor: (displaySlides[currentIndex]?.gradient?.[0] || COLORS.primary) + "15" },
        ]}
      />

      <TouchableOpacity style={styles.skipBtn} onPress={skip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Animated.FlatList
        ref={flatListRef}
        data={displaySlides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
        }}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {displaySlides.map((_, i) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [8, 28, 8],
            extrapolate: "clamp",
          });

          const dotColor = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [
              COLORS.border,
              displaySlides[i]?.gradient?.[0] ?? COLORS.primary,
              COLORS.border,
            ],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidth, backgroundColor: dotColor }]}
            />
          );
        })}
      </View>

      {/* Buttons */}
      <View style={styles.btnArea}>
        {currentIndex === displaySlides.length - 1 ? (
          <TouchableOpacity
            style={[
              styles.getStartedBtn,
              { backgroundColor: displaySlides[currentIndex]?.gradient?.[0] || COLORS.accent },
            ]}
            onPress={skip} // or go to next screen
          >
            <Text style={styles.getStartedText}>🚀 Get Started</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.nextBtn,
              { backgroundColor: displaySlides[currentIndex]?.gradient?.[0] || COLORS.primary },
            ]}
            onPress={goNext}
          >
            <Text style={styles.nextBtnText}>Next  <Ionicons name="arrow-forward" size={15} color={"#fff"} /></Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topDecor: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  skipBtn: {
    position: "absolute",
    top: 56,
    right: 24,
    zIndex: 10,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  skipText: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary },
  slide: {
    width,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 30,
  },
  imageContainer: {
    width: 240,
    height: 240,
    marginBottom: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    borderTopWidth: 4,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    width: "100%",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 12,
    textAlign: "center",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 23,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  dot: { height: 8, borderRadius: 4 },
  btnArea: { paddingHorizontal: 30, paddingBottom: 50 },
  nextBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  nextBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  getStartedBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  getStartedText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
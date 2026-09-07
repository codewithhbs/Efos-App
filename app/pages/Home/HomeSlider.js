import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import API from "../../utils/axiosInstanct"

const { width } = Dimensions.get("window")

// Layout dimensions tailored for peek/gap effects
const CARD_GAP = 12
const CARD_WIDTH = width - 48 // Shows a glimpse of adjacent slides
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP
const SLIDER_HEIGHT = 190
const AUTO_SCROLL_TIME = 5000

export default function HomeSlider({ navigation ,refreshing }) {
  const [sliders, setSliders] = useState([])
  const [loading, setLoading] = useState(true)

  const flatListRef = useRef(null)
  const currentIndex = useRef(0)
  const scrollX = useRef(new Animated.Value(0)).current

  // =====================================================
  // FETCH SLIDERS
  // =====================================================
  const fetchSliders = useCallback(async () => {
    try {
      setLoading(true)
      const response = await API.get("/slider/active/list")

      if (response.data?.success) {
        const data = response.data.data || []
        setSliders(data)
        currentIndex.current = 0
      }
    } catch (error) {
      console.error("Home slider error:", error)
      setSliders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSliders()
  }, [fetchSliders ,refreshing])

  // =====================================================
  // AUTO SCROLL
  // =====================================================
  useEffect(() => {
    if (sliders.length <= 1) return

    const interval = setInterval(() => {
      let nextIndex = currentIndex.current + 1
      if (nextIndex >= sliders.length) {
        nextIndex = 0
      }

      currentIndex.current = nextIndex

      flatListRef.current?.scrollToOffset({
        offset: nextIndex * SNAP_INTERVAL,
        animated: true
      })
    }, AUTO_SCROLL_TIME)

    return () => clearInterval(interval)
  }, [sliders.length])

  // Track active slide index accurately via scroll end
  const handleMomentumScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const newIndex = Math.round(offsetX / SNAP_INTERVAL)
    currentIndex.current = newIndex
  }

  // =====================================================
  // BUTTON ACTION
  // =====================================================
  const handleButtonPress = (item) => {
    if (!navigation || !item.button_action) return

    switch (item.button_action) {
      case "Courses":
        navigation.navigate("Courses")
        break
      case "Jobs":
        navigation.navigate("Jobs")
        break
      case "Mentors":
        navigation.navigate("Mentors")
        break
      default:
        console.log("Unknown slider action:", item.button_action)
        break
    }
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#812E2E" />
      </View>
    )
  }

  if (!sliders.length) return null

  // =====================================================
  // SLIDER ITEM
  // =====================================================
  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => handleButtonPress(item)}
        style={styles.slideCard}
      >
        <Image
          source={{ uri: item.image_url }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Gradient Overlay */}
        <LinearGradient
          colors={["rgba(0,0,0,0.02)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.85)"]}
          locations={[0, 0.5, 1]}
          style={styles.overlay}
        />

        {/* Content */}
        <View style={styles.content}>
          {!!item.title && (
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
          )}

          {!!item.subtitle && (
            <Text style={styles.subtitle} numberOfLines={2}>
              {item.subtitle}
            </Text>
          )}

          {!!item.button_text && (
            <View style={styles.button}>
              <Text style={styles.buttonText}>{item.button_text}</Text>
              <Ionicons name="arrow-forward" size={12} color="#fff" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      {/* SLIDER */}
      <Animated.FlatList
        ref={flatListRef}
        data={sliders}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}

        // Snap Configuration for Smooth Gaps
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="center"
        decelerationRate="fast"
        disableIntervalMomentum={true}

        contentContainerStyle={styles.listContent}
        onMomentumScrollEnd={handleMomentumScrollEnd}

        // Native Scroll Animation Event
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: SNAP_INTERVAL,
          offset: SNAP_INTERVAL * index,
          index
        })}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({
              offset: info.index * SNAP_INTERVAL,
              animated: true
            })
          }, 200)
        }}
      />

      {/* ANIMATED PAGINATION DOTS */}
      {sliders.length > 1 && (
        <View style={styles.dotsContainer}>
          {sliders.map((_, index) => {
            const inputRange = [
              (index - 1) * SNAP_INTERVAL,
              index * SNAP_INTERVAL,
              (index + 1) * SNAP_INTERVAL
            ]

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [6, 18, 6],
              extrapolate: "clamp"
            })

            const dotColor = scrollX.interpolate({
              inputRange,
              outputRange: ["#D1D5DB", "#812E2E", "#D1D5DB"],
              extrapolate: "clamp"
            })

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { width: dotWidth, backgroundColor: dotColor }
                ]}
              />
            )
          })}
        </View>
      )}
    </View>
  )
}

// =====================================================
// STYLES
// =====================================================
const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 6
  },

  listContent: {
    paddingHorizontal: (width - CARD_WIDTH) / 2 // Centers the active card
  },

  slideCard: {
    width: CARD_WIDTH,
    height: SLIDER_HEIGHT,
    borderRadius: 16,
    marginRight: CARD_GAP,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#E5E7EB"
  },

  image: {
    ...StyleSheet.absoluteFillObject
  },

  overlay: {
    ...StyleSheet.absoluteFillObject
  },

  content: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
    alignItems: "flex-start"
  },

  title: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 24,
    marginBottom: 4,
    maxWidth: "90%"
  },

  subtitle: {
    color: "rgba(255, 255, 255, 0.88)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    maxWidth: "90%",
    marginBottom: 10
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600"
  },

  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6
  },

  dot: {
    height: 6,
    borderRadius: 3
  },

  loaderContainer: {
    height: SLIDER_HEIGHT,
    marginHorizontal: 24,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    marginVertical: 6
  }
})
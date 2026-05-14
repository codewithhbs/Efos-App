import React, { useEffect, useRef } from "react"
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native"
import { COLORS } from "../utils/dummyData"
import useAuthStore from "../store/useAuthStore"

const { width, height } = Dimensions.get("window")

export default function SplashScreen({ navigation }) {
  const { isAuthenticated, initAuth, isLoading } = useAuthStore()
  const logoScale = useRef(new Animated.Value(0)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const textOpacity = useRef(new Animated.Value(0)).current
  const tagOpacity = useRef(new Animated.Value(0)).current
  const ring1 = useRef(new Animated.Value(0)).current
  const ring2 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // ========================
    // START AUTH INIT
    // ========================
    initAuth();

    // ========================
    // ANIMATIONS
    // ========================
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // ========================
    // RINGS ANIMATION
    // ========================
    Animated.loop(
      Animated.sequence([
        Animated.timing(ring1, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(ring1, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(ring2, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(ring2, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

  }, []);
  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigation.replace("Main");
      } else {
        navigation.replace("Onboarding");
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading]);
  const ring1Scale = ring1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5]
  })
  const ring1Opacity = ring1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 0.2, 0]
  })
  const ring2Scale = ring2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2]
  })
  const ring2Opacity = ring2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.15, 0]
  })

  return (
    <View style={styles.container}>
      {/* Background circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      {/* Ripple rings */}
      <Animated.View
        style={[
          styles.ring,
          { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: logoScale }], opacity: logoOpacity }
        ]}
      >
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🎓</Text>
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: textOpacity, alignItems: "center" }}>
        <Text style={styles.appName}>EFOS</Text>
      </Animated.View>

      <Animated.View style={{ opacity: tagOpacity, alignItems: "center" }}>
        <Text style={styles.tagline}>Learn · Grow · Succeed</Text>
      </Animated.View>

      <View style={styles.bottomRow}>
        <View style={styles.dot} />
        <View
          style={[
            styles.dot,
            { backgroundColor: COLORS.secondary, opacity: 0.7 }
          ]}
        />
        <View
          style={[styles.dot, { backgroundColor: COLORS.accent, opacity: 0.5 }]}
        />
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center"
  },
  bgCircle1: {
    position: "absolute",
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -80,
    right: -100
  },
  bgCircle2: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -50,
    left: -80
  },
  bgCircle3: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: height * 0.25,
    right: 30
  },
  ring: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)"
  },
  logoContainer: { marginBottom: 20 },
  logoBox: {
    width: 110,
    height: 110,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20
  },
  logoIcon: { fontSize: 52 },
  appName: {
    fontSize: 46,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
    marginBottom: 6
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
    letterSpacing: 2
  },
  bottomRow: {
    flexDirection: "row",
    gap: 8,
    position: "absolute",
    bottom: 100
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  poweredBy: {
    position: "absolute",
    bottom: 50,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.5
  }
})

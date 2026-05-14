import React, { useEffect, useState } from "react";

import {
  StatusBar,
  View,
  ActivityIndicator,
  Alert,
  AppState,
} from "react-native";

import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import * as LocalAuthentication from "expo-local-authentication";

import Navigation from "./services/Navigation";

import {
  askAllEssentialPermissions,
  setupTokenRefreshListener,
  setupForegroundHandler,
  setupBackgroundHandler,
  setupNotificationClickHandler,
} from "./services/askPermissions";

export default function App() {

  const [loading, setLoading] = useState(true);

  const [authenticated, setAuthenticated] =
    useState(false);

  // =========================
  // BIOMETRIC AUTH
  // =========================

  const authenticateUser = async () => {

    try {

      setLoading(true);

      // Check hardware

      const compatible =
        await LocalAuthentication.hasHardwareAsync();

      if (!compatible) {

        Alert.alert(
          "Unsupported Device",
          "Biometric authentication is not supported on this device."
        );

        setAuthenticated(true);
        return;
      }

      // Check enrolled biometrics

      const enrolled =
        await LocalAuthentication.isEnrolledAsync();

      if (!enrolled) {

        Alert.alert(
          "No Biometrics Found",
          "Please setup Fingerprint or Face ID in your device settings."
        );

        setAuthenticated(true);
        return;
      }

      // Authenticate

      const result =
        await LocalAuthentication.authenticateAsync({
          promptMessage: "Unlock App",
          subMessage: "Use Fingerprint or Face ID",
          fallbackLabel: "Use Passcode",
          cancelLabel: "Cancel",
          disableDeviceFallback: false,
        });

      console.log("Biometric Result:", result);

      if (result.success) {

        setAuthenticated(true);

      } else {

        setAuthenticated(false);

        Alert.alert(
          "Authentication Failed",
          "Fingerprint verification failed."
        );
      }

    } catch (error) {

      console.log("Biometric Error:", error);

      Alert.alert(
        "Error",
        "Something went wrong during authentication."
      );

    } finally {

      setLoading(false);
    }
  };

  // =========================
  // APP START
  // =========================

  useEffect(() => {

    authenticateUser();

    askAllEssentialPermissions();

    setupForegroundHandler();

    setupBackgroundHandler();

    setupNotificationClickHandler();

    setupTokenRefreshListener();

  }, []);

  // =========================
  // ASK AGAIN WHEN APP COMES
  // FROM BACKGROUND
  // =========================

  useEffect(() => {

    const subscription =
      AppState.addEventListener(
        "change",
        async (nextState) => {

          if (nextState === "active") {

            authenticateUser();
          }
        }
      );

    return () => {
      subscription.remove();
    };

  }, []);

  // =========================
  // LOADING SCREEN
  // =========================

  if (loading) {

    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // =========================
  // BLOCK APP
  // =========================

  if (!authenticated) {

    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // =========================
  // APP
  // =========================

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>

      <SafeAreaProvider>

        <StatusBar barStyle={"default"} />

        <Navigation />

      </SafeAreaProvider>

    </GestureHandlerRootView>
  );
}
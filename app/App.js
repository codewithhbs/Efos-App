import React, { useEffect } from "react";
import { StatusBar } from "react-native";

import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import Navigation from "./services/Navigation";

import {
  askAllEssentialPermissions,
  setupTokenRefreshListener,
  setupForegroundHandler,
  setupBackgroundHandler,
  setupNotificationClickHandler,
} from "./services/askPermissions";

export default function App() {
  useEffect(() => {
    askAllEssentialPermissions();
    setupForegroundHandler();
    setupBackgroundHandler();
    setupNotificationClickHandler();
    setupTokenRefreshListener();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="default" />
        <Navigation />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
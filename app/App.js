import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";

import Navigation from "./services/Navigation";
import {
  askAllEssentialPermissions,
  setupNotificationChannel,
  setupTokenRefreshListener,
  setupForegroundHandler,
  setupBackgroundHandler,
  setupNotificationClickHandler,
} from "./services/askPermissions";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// module scope — component ke bahar
setupBackgroundHandler();

export default function App() {
  useEffect(() => {
    let unsubMessage;
    let unsubToken;

    (async () => {
      await setupNotificationChannel();
      await askAllEssentialPermissions();

      unsubMessage = setupForegroundHandler();
      unsubToken = setupTokenRefreshListener();

      setupNotificationClickHandler();
    })();

    return () => {
      unsubMessage?.();
      unsubToken?.();
    };
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
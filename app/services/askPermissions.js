import messaging from "@react-native-firebase/messaging";
import { Alert, Linking } from "react-native";
import { saveData, getData } from "../utils/storage";
import * as Device from "expo-device";

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const PERMISSION_KEYS = {
  NOTIFICATION: "perm_notification",
  FCM_TOKEN: "fcm_token",
};

// ─── Open Settings ────────────────────────────────────────────────────────────
const openSettings = () => Linking.openSettings();

// ─── Alert for blocked permission ─────────────────────────────────────────────
const showSettingsAlert = () => {
  Alert.alert(
    "Notifications Blocked",
    "Please enable notifications from settings to receive updates.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Open Settings", onPress: openSettings },
    ]
  );
};

// ─── Request Notification Permission (Firebase) ──────────────────────────────
const requestUserPermission = async () => {
  const authStatus = await messaging().requestPermission();

  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  return { enabled, status: authStatus };
};

// ─── Get & Save FCM Token ─────────────────────────────────────────────────────
const saveFCMToken = async () => {
  try {
    if (!Device.isDevice) {
      console.log("⚠️ Must use real device");
      return null;
    }

    const token = await messaging().getToken();

    if (!token) return null;

    await saveData(PERMISSION_KEYS.FCM_TOKEN, token);

    console.log("🔥 FCM TOKEN:", token);

    return token;
  } catch (error) {
    console.error("[FCM ERROR]", error);
    return null;
  }
};

// ─── Ask Notification Permission ─────────────────────────────────────────────
export const askNotificationPermission = async () => {
  try {
    const { enabled } = await requestUserPermission();

    if (enabled) {
      await saveData(PERMISSION_KEYS.NOTIFICATION, "granted");

      const token = await saveFCMToken();

      return { granted: true, token };
    } else {
      await saveData(PERMISSION_KEYS.NOTIFICATION, "denied");

      showSettingsAlert();

      return { granted: false, token: null };
    }
  } catch (error) {
    console.error("[Permission Error]", error);

    return { granted: false, token: null };
  }
};

// ─── Re-Ask Permission ────────────────────────────────────────────────────────
export const reAskPermission = async () => {
  return await askNotificationPermission();
};

// ─── Get Saved Permission Status ─────────────────────────────────────────────
export const checkPermissionStatus = async () => {
  return await getData(PERMISSION_KEYS.NOTIFICATION);
};

// ─── Get Saved FCM Token ─────────────────────────────────────────────────────
export const getFCMToken = async () => {
  return await getData(PERMISSION_KEYS.FCM_TOKEN);
};

// ─── Ask All Permissions (on app start) ──────────────────────────────────────
export const askAllEssentialPermissions = async () => {
  const notification = await askNotificationPermission();
  return { notification };
};

// ─── Get All Permission Statuses ─────────────────────────────────────────────
export const getAllPermissionStatuses = async () => {
  const [notification, token] = await Promise.all([
    getData(PERMISSION_KEYS.NOTIFICATION),
    getData(PERMISSION_KEYS.FCM_TOKEN),
  ]);

  return { notification, fcmToken: token };
};

// ─── Listen Foreground Notifications ─────────────────────────────────────────
export const setupForegroundHandler = () => {
  return messaging().onMessage(async (remoteMessage) => {
    console.log("📩 Foreground Notification:", remoteMessage);
  });
};

// ─── Background Handler ──────────────────────────────────────────────────────
export const setupBackgroundHandler = () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log("📩 Background Notification:", remoteMessage);
  });
};

// ─── Handle Notification Click ───────────────────────────────────────────────
export const setupNotificationClickHandler = () => {
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log("📲 Notification Clicked (Background):", remoteMessage);
  });

  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log("📲 App opened from quit state:", remoteMessage);
      }
    });
};

// ─── Listen Token Refresh ────────────────────────────────────────────────────
export const setupTokenRefreshListener = () => {
  return messaging().onTokenRefresh(async (token) => {
    console.log("🔄 New FCM Token:", token);
    await saveData(PERMISSION_KEYS.FCM_TOKEN, token);
  });
};
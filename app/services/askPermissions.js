import messaging from "@react-native-firebase/messaging";
import { Alert, Linking ,Platform} from "react-native";
import { saveData, getData } from "../utils/storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
// ─── Storage Keys ─────────────────────────────────────────────────────────────
const PERMISSION_KEYS = {
  NOTIFICATION: "perm_notification",
  FCM_TOKEN: "fcm_token",
};
let fgUnsub = null;
let tokenUnsub = null;
let bgRegistered = false;
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
export const setupNotificationChannel = async () => {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.HIGH, // HIGH = heads-up popup
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
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
      console.log("⚠️ Must use a real device");
      return null;
    }

    // Get FCM Token
    const token = await messaging().getToken();

    if (!token) {
      console.log("❌ FCM Token not found");
      return null;
    }

    console.log("🔥 FCM TOKEN:", token);

    // Save Token
    const isSaved = await saveData(PERMISSION_KEYS.FCM_TOKEN, token);

    console.log("✅ Save Status:", isSaved);

    // Verify Saved Token
    const savedToken = await getData(PERMISSION_KEYS.FCM_TOKEN);

    console.log("📦 Saved Token:", savedToken);

    if (savedToken !== token) {
      console.warn("⚠️ Token was not saved correctly.");
    }

    return savedToken;
  } catch (error) {
    console.error("❌ FCM ERROR:", error);
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
  if (fgUnsub) return fgUnsub;   // already listening

  fgUnsub = messaging().onMessage(async (remoteMessage) => {
    console.log("📩 Foreground Notification:", remoteMessage);

    const title =
      remoteMessage?.notification?.title ||
      remoteMessage?.data?.title ||
      "Notification";

    const body =
      remoteMessage?.notification?.body ||
      remoteMessage?.data?.message ||
      "";

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
        data: remoteMessage?.data || {},
      },
      trigger: null,
    });
  });

  return fgUnsub;
};

// ─── Background Handler ──────────────────────────────────────────────────────
export const setupBackgroundHandler = () => {
  if (bgRegistered) return;
  bgRegistered = true;

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
  if (tokenUnsub) return tokenUnsub;

  tokenUnsub = messaging().onTokenRefresh(async (token) => {
    console.log("🔄 New FCM Token:", token);
    await saveData(PERMISSION_KEYS.FCM_TOKEN, token);
  });

  return tokenUnsub;
};
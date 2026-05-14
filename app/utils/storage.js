import AsyncStorage from "@react-native-async-storage/async-storage";


export const saveData = async (key, data) => {
  try {
    const stringData = JSON.stringify(data);
    await AsyncStorage.setItem(key, stringData);

    console.log(`✅ Saved: ${key}`);
    return true;
  } catch (error) {
    console.error("❌ Save Error:",key, error);
    return false;
  }
};


export const getData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);

    if (value !== null) {
      return JSON.parse(value);
    }

    return null;
  } catch (error) {
    console.error("❌ Get Error:", error);
    return null;
  }
};


export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`🗑️ Removed: ${key}`);
    return true;
  } catch (error) {
    console.error("❌ Remove Error:", error);
    return false;
  }
};


export const clearAll = async () => {
  try {
    await AsyncStorage.clear();
    console.log("🧹 Storage cleared");
    return true;
  } catch (error) {
    console.error("❌ Clear Error:", error);
    return false;
  }
};
import { create } from "zustand";
import API from "../utils/axiosInstanct";
import { getData, saveData, removeData, clearAll } from "../utils/storage";
import { getFCMToken } from "../services/askPermissions";

const persistSession = async ({ user, accessToken, refreshToken }) => {
  if (user) await saveData("user", user);
  if (accessToken) await saveData("accessToken", accessToken);
  if (refreshToken) await saveData("refreshToken", refreshToken);
};

const errMsg = (error, fallback) =>
  error?.response?.data?.message && typeof error.response.data.message === "string"
    ? error.response.data.message
    : fallback;

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: false,
  stats: null,
  student: null,
  isAuthenticated: false,

  // ========================
  // INIT (Auto Login)
  // ========================
  initAuth: async () => {
    try {
      set({ isLoading: true });

      const savedUser = await getData("user");
      if (savedUser) set({ user: savedUser, isAuthenticated: true });

      const res = await API.get("/auth/me");

      const user = res.data.user;
      const stats = res.data.stats;
      const student = res.data.student;

      await saveData("user", user);
      set({ user, stats, student, isAuthenticated: true });
    } catch (error) {
      set({ user: null, stats: null, student: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  // ========================
  // REGISTER
  // ========================
  register: async (payload) => {
    try {
      set({ isLoading: true });
      const fmc = await getFCMToken()
      const res = await API.post("/auth/register", { ...payload, fcm_token: fmc });

      return {
        success: true,
        message: res.data.message,
        registration_number: res.data.registration_number,

        phone: res.data.phone,
      };
    } catch (error) {
      return {
        success: false,
        message: errMsg(error, "Registration failed"),
        errors: error.response?.data?.message || {},
      };
    } finally {
      set({ isLoading: false });
    }
  },

  verifyRegisterOtp: async (registration_number, otp, fcm_token = null) => {
    try {
      set({ isLoading: true });

      const res = await API.post("/auth/verify-register-otp", {
        registration_number,
        otp,
        fcm_token,
      });

      const { user, accessToken, refreshToken } = res.data;

      await persistSession({ user, accessToken, refreshToken });
      set({ user, isAuthenticated: true });

      return { success: true, message: res.data.message, user };
    } catch (error) {
      return { success: false, message: errMsg(error, "Invalid or expired OTP") };
    } finally {
      set({ isLoading: false });
    }
  },

  resendRegisterOtp: async (registration_number) => {
    try {
      const res = await API.post("/auth/resend-register-otp", {
        registration_number,
      });
      return { success: true, message: res.data.message };
    } catch (error) {
      return { success: false, message: errMsg(error, "Failed to resend OTP") };
    }
  },

  // ========================
  // LOGIN — PASSWORD MODE
  // ========================
  loginWithPassword: async (registration_number, password) => {
    try {
      set({ isLoading: true });
      const fmc = await getFCMToken()
      const res = await API.post("/auth/login", {
        registration_number,
        password,
        mode: "password",
        fcm_token: fmc,
      });

      const { user, accessToken, refreshToken } = res.data;

      await persistSession({ user, accessToken, refreshToken });
      set({ user, isAuthenticated: true });

      return { success: true, message: res.data.message, user };
    } catch (error) {
      return {
        success: false,
        message: errMsg(error, "Invalid registration number or password"),
      };
    } finally {
      set({ isLoading: false });
    }
  },

  // ========================
  // LOGIN — OTP MODE (send otp)
  // ========================
  loginWithOtp: async (registration_number, fcm_token = null) => {
    try {
      set({ isLoading: true });
      const fmc = await getFCMToken()
      console.log(fmc)
      const res = await API.post("/auth/login", {
        registration_number,
        fcm_token: fmc,

        mode: "otp",
      });

      return {
        success: true,
        message: res.data.message,
        registration_number: res.data.registration_number || registration_number,
      };
    } catch (error) {
      return { success: false, message: errMsg(error, "Failed to send OTP") };
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOtp: async (registration_number, otp, fcm_token = null) => {
    try {
      set({ isLoading: true });

      const res = await API.post("/auth/verify-otp", {
        registration_number,
        otp,
        fcm_token,
      });

      const { user, accessToken, refreshToken } = res.data;

      await persistSession({ user, accessToken, refreshToken });
      set({ user, isAuthenticated: true });

      return { success: true, message: res.data.message };
    } catch (error) {
      return { success: false, message: errMsg(error, "Invalid OTP") };
    } finally {
      set({ isLoading: false });
    }
  },

  resendLoginOtp: async (registration_number) => {
    try {
           const fmc = await getFCMToken()

      const res = await API.post("/auth/resend-login-otp", {
        registration_number,
        fcm_token:fmc
      });
      return { success: true, message: res.data.message };
    } catch (error) {
      return { success: false, message: errMsg(error, "Failed to resend OTP") };
    }
  },

  // ========================
  // FORGET PASSWORD
  // ========================
  forgetPassword: async (email, newPassword) => {
    try {
      set({ isLoading: true });

      const res = await API.post("/auth/forget-password", {
        email,
        new_password: newPassword,
      });

      return { success: true, message: res.data.message || "OTP sent to your email" };
    } catch (error) {
      return { success: false, message: errMsg(error, "Failed to send OTP") };
    } finally {
      set({ isLoading: false });
    }
  },

  verifyForgetPasswordOtp: async (email, otp) => {
    try {
      set({ isLoading: true });

      const res = await API.post("/auth/verify-forget-password", { email, otp });

      return { success: true, message: res.data.message || "Password reset successfully" };
    } catch (error) {
      return { success: false, message: errMsg(error, "Invalid or expired OTP") };
    } finally {
      set({ isLoading: false });
    }
  },

  resendForgetPasswordOtp: async (email) => {
    try {
      const res = await API.post("/auth/resend-forget-password-otp", { email });
      return { success: true, message: res.data.message || "New OTP sent to your email" };
    } catch (error) {
      return { success: false, message: errMsg(error, "Failed to resend OTP") };
    }
  },

  // ========================
  // CHANGE PASSWORD (logged in)
  // ========================
  changePassword: async (current_password, new_password) => {
    try {
      const res = await API.post("/auth/change-password", {
        current_password,
        new_password,
        new_password_confirmation: new_password,
      });
      return { success: true, message: res.data.message };
    } catch (error) {
      return { success: false, message: errMsg(error, "Could not change password") };
    }
  },

  // ========================
  // LOGOUT
  // ========================
  logout: async () => {
    try {
      await API.post("/auth/logout");
    } catch (error) {
      console.log("Logout error:", error?.message);
    } finally {
      await clearAll();
      set({ user: null, stats: null, student: null, isAuthenticated: false });
    }
  },

  // ========================
  // PROFILE
  // ========================
  fetchProfile: async () => {
    try {
      const res = await API.get("/auth/me");

      const user = res.data.user;
      const stats = res.data.stats;
      const student = res.data.student;

      await saveData("user", user);
      await saveData("stats", stats);

      set({ user, stats, student, isAuthenticated: true });
    } catch (error) {
      console.log("Profile error:", error?.message);
    }
  },

  updateProfile: async (payload) => {
    try {
      await API.put("/auth/update", payload);
      await get().fetchProfile();
      return { success: true };
    } catch (error) {
      return { success: false, message: errMsg(error, "Update failed") };
    }
  },

  deleteAccount: async () => {
    try {
      await API.delete("/auth/delete-account");
      await clearAll();

      set({ user: null, stats: null, student: null, isAuthenticated: false });

      return { success: true };
    } catch (error) {
      return { success: false, message: "Failed to delete account" };
    }
  },
}));

export default useAuthStore;
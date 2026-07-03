import { create } from "zustand";
import API from "../utils/axiosInstanct";
import { getData, saveData, removeData, clearAll } from "../utils/storage";

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
      if (savedUser) {
        set({ user: savedUser, isAuthenticated: true });
      }

      const res = await API.get("/auth/me");
      const user = res.data.user;
      const stats = res.data.stats;
      const student = res.data.student

      await saveData("user", user);
      set({ user, stats, isAuthenticated: true, student });
    } catch (error) {
      // console.log("Init Auth Error:", error);
      set({ user: null, stats: null, isAuthenticated: false });
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

      const res = await API.post("/auth/register", payload);

      return {
        success: true,
        message: res.data.message,
        registration_number: res.data.registration_number,
        phone: res.data.phone,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Registration failed",
        errors: error.response?.data?.errors || {},
      };
    } finally {
      set({ isLoading: false });
    }
  },

  // ========================
  // VERIFY REGISTER OTP
  // ========================
  verifyRegisterOtp: async (
    registration_number,
    otp,
    fcm_token = null
  ) => {
    try {
      set({ isLoading: true });

      const res = await API.post(
        "/auth/verify-register-otp",
        {
          registration_number,
          otp,
          fcm_token,
        }
      );

      const {
        user,
        accessToken,
        refreshToken,
      } = res.data;

      await saveData("user", user);
      await saveData("accessToken", accessToken);
      await saveData("refreshToken", refreshToken);

      set({
        user,
        isAuthenticated: true,
      });

      return {
        success: true,
        message: res.data.message,
        user,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Invalid or expired OTP",
      };
    } finally {
      set({ isLoading: false });
    }
  },

  resendLoginOtp: async (registration_number) => {
  try {
    set({ isLoading: true });

    const res = await API.post("/auth/resend-login-otp", {
      registration_number,
    });

    return {
      success: true,
      message: res.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to resend OTP",
    };
  } finally {
    set({ isLoading: false });
  }
},
resendRegisterOtp: async (registration_number) => {
  try {
    set({ isLoading: true });

    const res = await API.post("/auth/resend-register-otp", {
      registration_number,
    });

    return {
      success: true,
      message: res.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to resend OTP",
    };
  } finally {
    set({ isLoading: false });
  }
},
  // ========================
  // LOGIN
  // ========================
  login: async (registration_number) => {
    try {
      set({ isLoading: true });

      const res = await API.post("/auth/login", {
        registration_number,
      });

      return {
        success: true,
        message: res.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to send OTP",
      };
    } finally {
      set({ isLoading: false });
    }
  },

  // ========================
  // VERIFY LOGIN OTP
  // ========================
  verifyOtp: async (registration_number, otp) => {
    try {
      set({ isLoading: true });

      const res = await API.post("/auth/verify-otp", {
        registration_number,
        otp,
      });

      const { user, accessToken, refreshToken } = res.data;

      await saveData("user", user);
      await saveData("accessToken", accessToken);
      await saveData("refreshToken", refreshToken);

      set({
        user,
        isAuthenticated: true,
      });

      return {
        success: true,
        message: res.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Invalid OTP",
      };
    } finally {
      set({ isLoading: false });
    }
  },

  // ========================
  // FORGET PASSWORD - Send OTP
  // ========================
  forgetPassword: async (email, newPassword) => {
    try {
      set({ isLoading: true });

      const res = await API.post("/auth/forget-password", {
        email,
        new_password: newPassword,
      });

      return {
        success: true,
        message: res.data.message || "OTP sent to your email",
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to send OTP",
      };
    } finally {
      set({ isLoading: false });
    }
  },

  // ========================
  // VERIFY OTP & RESET PASSWORD
  // ========================
  verifyForgetPasswordOtp: async (email, otp) => {
    try {
      set({ isLoading: true });

      const res = await API.post("/auth/verify-forget-password", { email, otp });

      return {
        success: true,
        message: res.data.message || "Password reset successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Invalid or expired OTP",
      };
    } finally {
      set({ isLoading: false });
    }
  },

  // ========================
  // RESEND OTP
  // ========================
  resendForgetPasswordOtp: async (email) => {
    try {
      set({ isLoading: true });

      const res = await API.post("/auth/resend-forget-password-otp", { email });

      return {
        success: true,
        message: res.data.message || "New OTP sent to your email",
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to resend OTP",
      };
    } finally {
      set({ isLoading: false });
    }
  },

  // ========================
  // LOGOUT
  // ========================
  logout: async () => {
    try {
      await API.post("/auth/logout");
      await clearAll();

      set({
        user: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.log("Logout error:", error);
      await clearAll();
      set({ user: null, isAuthenticated: false });
    }
  },

  // ========================
  // GET PROFILE
  // ========================
  fetchProfile: async () => {
    try {
      const res = await API.get("/auth/me");
      const student = res.data.student
      const user = res.data.user;
      const stats = res.data.stats;

      await saveData("user", user);
      await saveData("stats", stats);
      set({ user, stats, isAuthenticated: true, student });
    } catch (error) {
      console.log("Profile error:", error);
    }
  },

  // ========================
  // UPDATE PROFILE
  // ========================
  updateProfile: async (payload) => {
    try {
      const res = await API.put("/auth/update", payload);
      await get().fetchProfile();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Update failed",
      };
    }
  },

  // ========================
  // DELETE ACCOUNT
  // ========================
  deleteAccount: async () => {
    try {
      await API.delete("/auth/delete-account");
      await clearAll();

      set({
        user: null,
        isAuthenticated: false,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: "Failed to delete account",
      };
    }
  },
}));

export default useAuthStore;
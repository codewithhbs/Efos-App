import axios from "axios";
import { getData, saveData, clearAll } from "./storage";
import { API_URL } from "../constant/constant";


const API = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});


// ========================
// REQUEST INTERCEPTOR
// ========================
API.interceptors.request.use(
    async (config) => {
        try {
            const token = await getData("accessToken");
            console.log("Token",token)
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.log("Request Error:", error);
        }

        return config;
    },
    (error) => Promise.reject(error)
);


// ========================
// RESPONSE INTERCEPTOR
// ========================
API.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        // ========================
        // HANDLE 401 (TOKEN EXPIRED)
        // ========================
        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            try {
                // 🔁 call refresh API
                const res = await axios.post(
                    `${API_URL}/auth/refresh-token`,
                    {},
                    { withCredentials: true }
                );

                const newAccessToken = res.data?.accessToken;

                if (newAccessToken) {
                    await saveData("accessToken", newAccessToken);
                    // retry original request
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return API(originalRequest);
                }

            } catch (refreshError) {
                console.log("Refresh failed");

                // ❌ logout
                await clearAll();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default API;
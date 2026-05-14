// services/zoomService.js

const axios = require("axios");

class ZoomService {
    async generateToken() {
        try {
            const response = await axios.post(
                "https://zoom.us/oauth/token",
                new URLSearchParams({
                    grant_type: "account_credentials",
                    account_id: process.env.ZOOM_ACCOUNT_ID
                }),
                {
                    auth: {
                        username: process.env.ZOOM_CLIENT_ID,
                        password: process.env.ZOOM_CLIENT_SECRET
                    },
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                }
            );

            return response.data.access_token;

        } catch (error) {
            console.log("Zoom Token Error:", error.response?.data || error.message);
            throw error;
        }
    }

    async createMeeting(topic, startTime, duration) {
        try {
            const token = await this.generateToken();

            const response = await axios.post(
                `https://api.zoom.us/v2/users/${process.env.ZOOM_USER_EMAIL}/meetings`,
                {
                    topic,
                    type: 2,
                    start_time: startTime,
                    duration,
                    timezone: "Asia/Kolkata",
                    agenda: "Mentor Session",
                    settings: {
                        host_video: true,
                        participant_video: true,
                        waiting_room: true
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            return response.data;

        } catch (error) {
            console.log("Zoom Create Meeting Error:", error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new ZoomService();
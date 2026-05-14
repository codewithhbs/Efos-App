const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
// 🔐 Login limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,

    keyGenerator: (req) => {
        const ip = ipKeyGenerator(req);
        const user = req.body.registration_number || "unknown";
        return `${ip}_${user}`;
    },
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: "Too many login attempts, try again later",
    },
    standardHeaders: true,
    legacyHeaders: false,
});


const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 min
    max: 100,
});

module.exports = {
    loginLimiter,
    apiLimiter,
};
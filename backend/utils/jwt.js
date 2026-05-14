const jwt = require("jsonwebtoken");

const signToken = (payload, options = {}) => {
    try {
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
            expiresIn: process.env.JWT_EXPIRY_TIME || "7d",
            ...options,
        });

        return token;
    } catch (error) {
        throw new Error("Token generation failed");
    }
};

const signRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, {
        expiresIn: "7d",
    });
};

const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        return decoded;
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
};


const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
};

module.exports = {
    signToken,
    verifyToken,
    signRefreshToken,
    decodeToken,
};
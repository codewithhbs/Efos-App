const { verifyToken, signToken } = require("../utils/jwt");
const getPool = require("../config/db");

const extractTokens = (req) => {
  let accessToken = null;
  let refreshToken = null;

  // Header
  if (req.headers.authorization?.startsWith("Bearer ")) {
    accessToken = req.headers.authorization.split(" ")[1];
  }

  // Cookies
  if (req.cookies?.accessToken) {
    accessToken = req.cookies.accessToken;
  }

  if (req.cookies?.refreshToken) {
    refreshToken = req.cookies.refreshToken;
  }

  return { accessToken, refreshToken };
};


const authMiddleware = async (req, res, next) => {
  try {
    const { accessToken, refreshToken } = extractTokens(req);

    if (accessToken) {
      try {
        const decoded = verifyToken(accessToken);
        req.user = decoded;
        return next();
      } catch (err) {
      }
    }

    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM user_tokens WHERE refresh_token = ? AND is_revoked = 0",
      [refreshToken]
    );

    if (!rows.length) {
      return res.status(403).json({ message: "Session expired" });
    }

    const newAccessToken = signToken({ id: decoded.id });

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "lax",
    });

    req.user = decoded;

    return next();

  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = authMiddleware;
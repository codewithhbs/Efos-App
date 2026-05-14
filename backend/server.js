require("dotenv").config();
require("events").EventEmitter.defaultMaxListeners = 20;

const app = require("./app");
const getPool = require("./config/db");

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    const pool = getPool();

    const connection = await pool.getConnection();
    connection.release();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ DB Error:", error.message);
    process.exit(1);
  }
};

startServer();
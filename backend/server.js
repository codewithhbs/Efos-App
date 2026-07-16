require("dotenv").config();
require("events").EventEmitter.defaultMaxListeners = 20;

const os = require("os");
const app = require("./app");
const getPool = require("./config/db");

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    const pool = getPool();

    const connection = await pool.getConnection();
    connection.release();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server is running!`);
      console.log(`Local:   http://localhost:${PORT}`);

      const interfaces = os.networkInterfaces();

      Object.keys(interfaces).forEach((name) => {
        interfaces[name].forEach((iface) => {
          if (iface.family === "IPv4" && !iface.internal) {
            console.log(`Network: http://${iface.address}:${PORT}`);
          }
        });
      });
    });
  } catch (error) {
    console.error("❌ DB Error:", error.message);
    process.exit(1);
  }
};

startServer();
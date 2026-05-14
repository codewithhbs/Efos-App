const mysql = require("mysql2/promise");

const isProd = process.env.APP_ENV === "production";

// Global singleton (important)
let pool;

const getPool = () => {
  if (!pool) {
    const dbConfig = {
      host: isProd
        ? process.env.DB_PROD_HOST
        : process.env.DB_LOCAL_HOST,

      user: isProd
        ? process.env.DB_PROD_USER
        : process.env.DB_LOCAL_USER,

      password: isProd
        ? process.env.DB_PROD_PASSWORD
        : process.env.DB_LOCAL_PASSWORD,

      database: isProd
        ? process.env.DB_PROD_NAME
        : process.env.DB_LOCAL_NAME,

      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };

    pool = mysql.createPool(dbConfig);

    console.log(`📦 DB Pool Created (${isProd ? "PROD" : "LOCAL"})`);
  }

  return pool;
};

module.exports = getPool;
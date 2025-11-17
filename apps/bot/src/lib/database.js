"use strict";

const mysql = require("mysql2/promise");

class Database {
  constructor() {
    this.pool = null;
  }

  async initialize() {
    if (this.pool) {
      return;
    }

    const config = {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306", 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    };

    this.pool = mysql.createPool(config);

    // Test connection
    try {
      const connection = await this.pool.getConnection();
      console.log("✅ Database connected successfully");
      connection.release();
    } catch (error) {
      console.error("❌ Database connection failed:", error.message);
      throw error;
    }
  }

  async query(sql, params = []) {
    if (!this.pool) {
      throw new Error("Database not initialized. Call initialize() first.");
    }

    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error("Database query error:", error);
      throw error;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log("Database connection closed");
    }
  }

  isConfigured() {
    return this.pool !== null;
  }
}

// Export singleton instance
module.exports = new Database();

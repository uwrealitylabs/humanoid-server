import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || "development",
};

export default config;

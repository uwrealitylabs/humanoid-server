import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  rosbridge_url: process.env.ROSBRIDGE_URL || 'ws://localhost',
  rosbridge_port: process.env.ROSBRIDGE_PORT || '9090',
  environment: process.env.NODE_ENV || "development",
};

export default config;

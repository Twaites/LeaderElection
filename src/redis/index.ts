import { Redis } from "ioredis";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not set");
  }
  
  const redisURL = process.env.REDIS_URL as string;
  const redisOptions = redisURL.includes("upstash") ? { family: 6 } : {};
  
  const redisClient = new Redis(redisURL, redisOptions);
  
  redisClient.on("error", (err) => {
    console.error("Redis error: ", err);
  });
  
  redisClient.on("connect", () => {
    console.log("Successfully connected to Redis");
  });
  
  redisClient.on("ready", () => {
    console.log("Redis client is ready");
  });
  
  // Test Redis connection on startup
  async function testRedisConnection() {
    try {
      await redisClient.ping();
      console.log("Redis connection test successful");
    } catch (error) {
      console.error("Redis connection test failed:", error);
    }
  }
  
  testRedisConnection();
  
  export default redisClient; 

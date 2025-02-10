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
  
  export default redisClient; 

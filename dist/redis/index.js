"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = require("ioredis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not set");
}
const redisURL = process.env.REDIS_URL;
const redisOptions = redisURL.includes("upstash") ? { family: 6 } : {};
const redisClient = new ioredis_1.Redis(redisURL, redisOptions);
redisClient.on("error", (err) => {
    console.error("Redis error: ", err);
});
exports.default = redisClient;

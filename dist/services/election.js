"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lastKnownLeader = exports.isCurrentLeader = exports.electLeader = void 0;
const leader_1 = require("../redis/leader");
const leader_2 = require("../db/leader");
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = require("../config");
const LEADER_REFRESH_INTERVAL = Math.floor(config_1.LEADER_TTL * 0.6) * 1000; // Refresh at 60% of TTL
const FOLLOWER_CHECK_INTERVAL = Math.floor(config_1.LEADER_TTL * 0.8) * 1000; // Check less frequently as follower
let isCurrentLeader = false;
exports.isCurrentLeader = isCurrentLeader;
let lastKnownLeader = null;
exports.lastKnownLeader = lastKnownLeader;
let lastCheckTime = 0;
async function electLeader() {
    const now = Date.now();
    try {
        if (isCurrentLeader) {
            // Leader only needs to refresh its key periodically
            if (now - lastCheckTime >= LEADER_REFRESH_INTERVAL) {
                if (await (0, leader_1.tryBecomeLeader)()) {
                    await (0, leader_2.updateLeader)(process.env.FLY_MACHINE_ID);
                    lastCheckTime = now;
                }
                else {
                    exports.isCurrentLeader = isCurrentLeader = false;
                    exports.lastKnownLeader = lastKnownLeader = null;
                    (0, logger_1.default)(`${process.env.FLY_MACHINE_ID} lost leadership`);
                }
            }
        }
        else {
            // Non-leaders check less frequently
            if (now - lastCheckTime >= FOLLOWER_CHECK_INTERVAL) {
                const redisLeader = await (0, leader_1.getRedisLeader)();
                if (!redisLeader && await (0, leader_1.tryBecomeLeader)()) {
                    exports.isCurrentLeader = isCurrentLeader = true;
                    exports.lastKnownLeader = lastKnownLeader = process.env.FLY_MACHINE_ID || null;
                    (0, logger_1.default)(`${process.env.FLY_MACHINE_ID} is now the leader`);
                    await (0, leader_2.updateLeader)(process.env.FLY_MACHINE_ID);
                }
                else {
                    exports.lastKnownLeader = lastKnownLeader = redisLeader;
                }
                lastCheckTime = now;
            }
        }
    }
    catch (error) {
        (0, logger_1.default)(`Error in election process: ${error}`);
        // Don't reset lastCheckTime on error to prevent rapid retries
    }
}
exports.electLeader = electLeader;
async function refreshLeader() {
    const currentLeader = await (0, leader_1.getRedisLeader)();
    if (currentLeader === process.env.FLY_MACHINE_ID) {
        (0, logger_1.default)(`Refreshing leader ${process.env.FLY_MACHINE_ID} in Redis`);
        await (0, leader_1.tryBecomeLeader)();
        await (0, leader_2.updateLeader)(process.env.FLY_MACHINE_ID);
    }
}
async function detectFailover() {
    const redisLeader = await (0, leader_1.getRedisLeader)();
    if (!redisLeader) {
        (0, logger_1.default)("Leader missing from Redis! Checking PostgreSQL...");
        const pgLeader = await (0, leader_2.getCurrentLeader)();
        if (pgLeader) {
            const leaderDownTime = Date.now() - new Date(pgLeader.last_heartbeat).getTime();
            if (leaderDownTime > config_1.FAILOVER_THRESHOLD) {
                (0, logger_1.default)("Leader has been offline too long! Electing new leader...");
                if (await (0, leader_1.tryBecomeLeader)()) {
                    (0, logger_1.default)(`${process.env.FLY_MACHINE_ID} is now the new leader`);
                    await (0, leader_2.updateLeader)(process.env.FLY_MACHINE_ID);
                }
            }
        }
    }
}
// Run leader election at startup
electLeader();
// Keep refreshing the leader status every minute
setInterval(refreshLeader, LEADER_REFRESH_INTERVAL);
// Check for failover every minute
setInterval(detectFailover, LEADER_REFRESH_INTERVAL);

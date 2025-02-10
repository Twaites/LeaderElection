"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.electLeader = void 0;
const leader_1 = require("../redis/leader");
const leader_2 = require("../db/leader");
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = require("../config");
const LEADER_REFRESH_INTERVAL = 60 * 1000; // 1 minute
async function electLeader() {
    const redisLeader = await (0, leader_1.getRedisLeader)();
    if (!redisLeader) {
        (0, logger_1.default)("No leader in Redis. Checking PostgreSQL...");
        const pgLeader = await (0, leader_2.getCurrentLeader)();
        if (!pgLeader) {
            (0, logger_1.default)("No leader found. Trying to become leader...");
            if (await (0, leader_1.tryBecomeLeader)()) {
                (0, logger_1.default)(`${process.env.SERVER_ID} is now the leader`);
                await (0, leader_2.updateLeader)(process.env.SERVER_ID);
            }
        }
        else {
            (0, logger_1.default)(`Using PostgreSQL leader: ${pgLeader.server_id}`);
        }
    }
    else {
        (0, logger_1.default)(`Current leader: ${redisLeader}`);
    }
}
exports.electLeader = electLeader;
async function refreshLeader() {
    const currentLeader = await (0, leader_1.getRedisLeader)();
    if (currentLeader === process.env.SERVER_ID) {
        (0, logger_1.default)(`Refreshing leader ${process.env.SERVER_ID} in Redis`);
        await (0, leader_1.tryBecomeLeader)();
        await (0, leader_2.updateLeader)(process.env.SERVER_ID);
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
                    (0, logger_1.default)(`${process.env.SERVER_ID} is now the new leader`);
                    await (0, leader_2.updateLeader)(process.env.SERVER_ID);
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

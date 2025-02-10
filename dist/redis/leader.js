"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisLeader = exports.tryBecomeLeader = exports.getLeaderInfo = exports.updateLeaderHeartbeat = void 0;
const index_1 = __importDefault(require("./index"));
const config_1 = require("../config");
const logger_1 = __importDefault(require("../utils/logger"));
async function updateLeaderHeartbeat() {
    try {
        const now = Date.now();
        const success = await index_1.default.set(config_1.LEADER_KEY, JSON.stringify({ instanceId: config_1.INSTANCE_ID, lastHeartbeat: now }), 'EX', config_1.LEADER_TTL);
        return success === 'OK';
    }
    catch (error) {
        (0, logger_1.default)(`Redis error in updateLeaderHeartbeat: ${error}`);
        return false;
    }
}
exports.updateLeaderHeartbeat = updateLeaderHeartbeat;
async function getLeaderInfo() {
    try {
        const data = await index_1.default.get(config_1.LEADER_KEY);
        return data ? JSON.parse(data) : null;
    }
    catch (error) {
        (0, logger_1.default)(`Redis error in getLeaderInfo: ${error}`);
        return null;
    }
}
exports.getLeaderInfo = getLeaderInfo;
async function tryBecomeLeader() {
    try {
        const success = await index_1.default.set(config_1.LEADER_KEY, JSON.stringify({ instanceId: config_1.INSTANCE_ID, lastHeartbeat: Date.now() }), 'EX', config_1.LEADER_TTL, 'NX');
        return success !== null;
    }
    catch (error) {
        (0, logger_1.default)(`Redis error in tryBecomeLeader: ${error}`);
        return false;
    }
}
exports.tryBecomeLeader = tryBecomeLeader;
async function getRedisLeader() {
    try {
        return await index_1.default.get(config_1.LEADER_KEY);
    }
    catch (error) {
        (0, logger_1.default)(`Redis error in getRedisLeader: ${error}`);
        return null;
    }
}
exports.getRedisLeader = getRedisLeader;

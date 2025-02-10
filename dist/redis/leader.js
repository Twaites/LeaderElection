"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisLeader = exports.tryBecomeLeader = void 0;
const index_1 = __importDefault(require("./index"));
const config_1 = require("../config");
const logger_1 = __importDefault(require("../utils/logger"));
async function tryBecomeLeader() {
    try {
        const success = await index_1.default.set(config_1.LEADER_KEY, process.env.FLY_MACHINE_ID, 'EX', config_1.LEADER_TTL, 'NX');
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

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisLeader = exports.tryBecomeLeader = void 0;
const index_1 = __importDefault(require("./index"));
const config_1 = require("../config");
async function tryBecomeLeader() {
    const success = await index_1.default.set(config_1.LEADER_KEY, process.env.SERVER_ID, 'EX', config_1.LEADER_TTL, 'NX');
    return success !== null;
}
exports.tryBecomeLeader = tryBecomeLeader;
async function getRedisLeader() {
    return await index_1.default.get(config_1.LEADER_KEY);
}
exports.getRedisLeader = getRedisLeader;

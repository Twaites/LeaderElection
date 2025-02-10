"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAILOVER_THRESHOLD = exports.LEADER_TTL = exports.LEADER_KEY = void 0;
exports.LEADER_KEY = "current_leader";
exports.LEADER_TTL = 120; // Leader TTL in Redis (seconds)
exports.FAILOVER_THRESHOLD = 5 * 60 * 1000; // 5 minutes (in ms)

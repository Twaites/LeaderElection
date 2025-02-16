"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSTANCE_ID = exports.FOLLOWER_CHECK_RATIO = exports.LEADER_REFRESH_RATIO = exports.LEADER_TTL = exports.LEADER_KEY = void 0;
exports.LEADER_KEY = "current_leader";
exports.LEADER_TTL = 120; // 2 minutes in seconds
exports.LEADER_REFRESH_RATIO = 0.6; // Refresh at 60% of TTL
exports.FOLLOWER_CHECK_RATIO = 0.8; // Check at 80% of TTL
// Get instance ID once at startup
const instanceId = process.env.FLY_REGION + "." + process.env.FLY_MACHINE_ID;
if (!instanceId) {
    throw new Error('FLY_MACHINE_ID must be set');
}
exports.INSTANCE_ID = instanceId;

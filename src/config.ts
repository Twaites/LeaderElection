export const LEADER_KEY = "current_leader";
export const LEADER_TTL = 240; // 4 minutes in seconds
export const LEADER_REFRESH_RATIO = 0.6; // Refresh at 60% of TTL
export const FOLLOWER_CHECK_RATIO = 0.8; // Check at 80% of TTL

// Get instance ID once at startup
const instanceId = process.env.FLY_REGION + "." + process.env.FLY_MACHINE_ID;
if (!instanceId) {
    throw new Error('FLY_MACHINE_ID must be set');
}
export const INSTANCE_ID = instanceId;

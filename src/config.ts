export const LEADER_KEY = "current_leader";
export const LEADER_TTL = 120; // Leader TTL in Redis (seconds)
export const FAILOVER_THRESHOLD = 5 * 60 * 1000; // 5 minutes (in ms)

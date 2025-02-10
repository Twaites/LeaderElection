export const LEADER_KEY = "current_leader";
export const LEADER_TTL = 120; // 2 minutes in seconds
export const LEADER_REFRESH_RATIO = 0.6; // Refresh at 60% of TTL
export const FOLLOWER_CHECK_RATIO = 0.8; // Check at 80% of TTL

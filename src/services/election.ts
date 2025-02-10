import { tryBecomeLeader, getRedisLeader } from "../redis/leader";
import { updateLeader, getCurrentLeader } from "../db/leader";
import logEvent from "../utils/logger";
import { LEADER_TTL, FAILOVER_THRESHOLD } from "../config";

const LEADER_REFRESH_INTERVAL = Math.floor(LEADER_TTL * 0.6) * 1000; // Refresh at 60% of TTL
const FOLLOWER_CHECK_INTERVAL = Math.floor(LEADER_TTL * 0.8) * 1000; // Check less frequently as follower
let isCurrentLeader = false;
let lastKnownLeader: string | null = null;
let lastCheckTime = 0;

async function electLeader(): Promise<void> {
    const now = Date.now();
    try {
        if (isCurrentLeader) {
            // Leader only needs to refresh its key periodically
            if (now - lastCheckTime >= LEADER_REFRESH_INTERVAL) {
                if (await tryBecomeLeader()) {
                    await updateLeader(process.env.FLY_MACHINE_ID!);
                    lastCheckTime = now;
                } else {
                    isCurrentLeader = false;
                    lastKnownLeader = null;
                    logEvent(`${process.env.FLY_MACHINE_ID} lost leadership`);
                }
            }
        } else {
            // Non-leaders check less frequently
            if (now - lastCheckTime >= FOLLOWER_CHECK_INTERVAL) {
                const redisLeader = await getRedisLeader();
                
                if (!redisLeader && await tryBecomeLeader()) {
                    isCurrentLeader = true;
                    lastKnownLeader = process.env.FLY_MACHINE_ID || null;
                    logEvent(`${process.env.FLY_MACHINE_ID} is now the leader`);
                    await updateLeader(process.env.FLY_MACHINE_ID!);
                } else {
                    lastKnownLeader = redisLeader;
                }
                lastCheckTime = now;
            }
        }
    } catch (error) {
        logEvent(`Error in election process: ${error}`);
        // Don't reset lastCheckTime on error to prevent rapid retries
    }
}

async function refreshLeader(): Promise<void> {
    const currentLeader = await getRedisLeader();

    if (currentLeader === process.env.FLY_MACHINE_ID ) {
        logEvent(`Refreshing leader ${process.env.FLY_MACHINE_ID } in Redis`);
        await tryBecomeLeader();
        await updateLeader(process.env.FLY_MACHINE_ID !);
    }
}

async function detectFailover(): Promise<void> {
    const redisLeader = await getRedisLeader();

    if (!redisLeader) {
        logEvent("Leader missing from Redis! Checking PostgreSQL...");
        const pgLeader = await getCurrentLeader();

        if (pgLeader) {
            const leaderDownTime = Date.now() - new Date(pgLeader.last_heartbeat).getTime();

            if (leaderDownTime > FAILOVER_THRESHOLD) {
                logEvent("Leader has been offline too long! Electing new leader...");
                if (await tryBecomeLeader()) {
                    logEvent(`${process.env.FLY_MACHINE_ID } is now the new leader`);
                    await updateLeader(process.env.FLY_MACHINE_ID !);
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

// Export for testing and monitoring
export { electLeader, isCurrentLeader, lastKnownLeader };

import { tryBecomeLeader, getRedisLeader } from "../redis/leader";
import { updateLeader, getCurrentLeader } from "../db/leader";
import logEvent from "../utils/logger";
import { LEADER_TTL, FAILOVER_THRESHOLD } from "../config";

const LEADER_REFRESH_INTERVAL = 60 * 1000; // 1 minute

async function electLeader(): Promise<void> {
    const redisLeader = await getRedisLeader();

    if (!redisLeader) {
        logEvent("No leader in Redis. Checking PostgreSQL...");

        const pgLeader = await getCurrentLeader();

        if (!pgLeader) {
            logEvent("No leader found. Trying to become leader...");
            if (await tryBecomeLeader()) {
                logEvent(`${process.env.FLY_MACHINE_ID } is now the leader`);
                await updateLeader(process.env.FLY_MACHINE_ID !);
            }
        } else {
            logEvent(`Using PostgreSQL leader: ${pgLeader.server_id}`);
        }
    } else {
        logEvent(`Current leader: ${redisLeader}`);
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

export { electLeader };

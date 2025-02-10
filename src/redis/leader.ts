import redisClient from "./index";
import { LEADER_KEY, LEADER_TTL, INSTANCE_ID } from "../config";
import logEvent from "../utils/logger";

interface LeaderInfo {
    instanceId: string;
    lastHeartbeat: number;
}

export async function updateLeaderHeartbeat(): Promise<boolean> {
    try {
        const now = Date.now();
        const success = await redisClient.set(
            LEADER_KEY,
            JSON.stringify({ instanceId: INSTANCE_ID, lastHeartbeat: now }),
            'EX',
            LEADER_TTL
        );
        return success === 'OK';
    } catch (error) {
        logEvent(`Redis error in updateLeaderHeartbeat: ${error}`);
        return false;
    }
}

export async function getLeaderInfo(): Promise<LeaderInfo | null> {
    try {
        const data = await redisClient.get(LEADER_KEY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        logEvent(`Redis error in getLeaderInfo: ${error}`);
        return null;
    }
}

export async function tryBecomeLeader(): Promise<boolean> {
    try {
        const success = await redisClient.set(
            LEADER_KEY,
            JSON.stringify({ instanceId: INSTANCE_ID, lastHeartbeat: Date.now() }),
            'EX',
            LEADER_TTL,
            'NX'
        );
        return success !== null;
    } catch (error) {
        logEvent(`Redis error in tryBecomeLeader: ${error}`);
        return false;
    }
}

export async function getRedisLeader(): Promise<string | null> {
    try {
        return await redisClient.get(LEADER_KEY);
    } catch (error) {
        logEvent(`Redis error in getRedisLeader: ${error}`);
        return null;
    }
}

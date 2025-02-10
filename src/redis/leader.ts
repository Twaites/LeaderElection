import redisClient from "./index";
import { LEADER_KEY, LEADER_TTL, INSTANCE_ID } from "../config";
import logEvent from "../utils/logger";

export async function tryBecomeLeader(): Promise<boolean> {
    try {
        const success = await redisClient.set(
            LEADER_KEY,
            INSTANCE_ID,
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

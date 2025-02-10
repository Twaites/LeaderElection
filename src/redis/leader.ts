import redisClient from "./index";
import { LEADER_KEY, LEADER_TTL } from "../config";

export async function tryBecomeLeader(): Promise<boolean> {
    const success = await redisClient.set(LEADER_KEY, process.env.FLY_MACHINE_ID !, 'EX', LEADER_TTL, 'NX')
    return success !== null;
}

export async function getRedisLeader(): Promise<string | null> {
    return await redisClient.get(LEADER_KEY);
}

import { db } from "./index";

export type LeaderEventType = 'ELECTED' | 'LOST';

export async function recordLeaderEvent(
    instanceId: string, 
    eventType: LeaderEventType, 
    details?: Record<string, any>
): Promise<void> {
    await db.query(
        `INSERT INTO ${process.env.LEADER_HISTORY_TABLE_NAME || 'leader_history'} (instance_id, event_type, details)
         VALUES ($1, $2, $3)`,
        [instanceId, eventType, details ? JSON.stringify(details) : null]
    );
} 
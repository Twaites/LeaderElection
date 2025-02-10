import { db } from "./index";

export async function updateLeader(serverId: string): Promise<void> {
    await db.query(
        `INSERT INTO ${process.env.LEADER_TABLE_NAME || 'leader_election'} (server_id, last_heartbeat)
         VALUES ($1, NOW())
         ON CONFLICT (server_id) DO UPDATE SET last_heartbeat = NOW()`,
        [serverId]
    );
}

export async function getCurrentLeader(): Promise<{ server_id: string, last_heartbeat: string } | null> {
    const result = await db.query(
        `SELECT server_id, last_heartbeat FROM ${process.env.LEADER_TABLE_NAME || 'leader_election'} ORDER BY last_heartbeat DESC LIMIT 1`
    );
    return result.rows[0] || null;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentLeader = exports.updateLeader = void 0;
const index_1 = require("./index");
async function updateLeader(serverId) {
    await index_1.db.query(`INSERT INTO ${process.env.LEADER_TABLE_NAME || 'leader_election'} (server_id, last_heartbeat)
         VALUES ($1, NOW())
         ON CONFLICT (server_id) DO UPDATE SET last_heartbeat = NOW()`, [serverId]);
}
exports.updateLeader = updateLeader;
async function getCurrentLeader() {
    const result = await index_1.db.query(`SELECT server_id, last_heartbeat FROM ${process.env.LEADER_TABLE_NAME || 'leader_election'} ORDER BY last_heartbeat DESC LIMIT 1`);
    return result.rows[0] || null;
}
exports.getCurrentLeader = getCurrentLeader;

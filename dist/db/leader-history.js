"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordLeaderEvent = void 0;
const index_1 = require("./index");
async function recordLeaderEvent(instanceId, eventType, details) {
    await index_1.db.query(`INSERT INTO ${process.env.LEADER_HISTORY_TABLE_NAME || 'leader_history'} (instance_id, event_type, details)
         VALUES ($1, $2, $3)`, [instanceId, eventType, details ? JSON.stringify(details) : null]);
}
exports.recordLeaderEvent = recordLeaderEvent;

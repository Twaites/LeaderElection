"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const leader_1 = require("../redis/leader");
const leader_2 = require("../db/leader");
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = require("../config");
class LeaderElection {
    isLeader = false;
    intervalHandle;
    instanceId;
    checkInterval;
    constructor() {
        this.instanceId = process.env.FLY_MACHINE_ID;
        this.checkInterval = Math.floor(config_1.LEADER_TTL * 0.5) * 1000;
        if (!this.instanceId) {
            throw new Error('FLY_MACHINE_ID must be set');
        }
    }
    async checkLeadership() {
        try {
            const currentLeader = await (0, leader_1.getRedisLeader)();
            if (this.isLeader) {
                if (await (0, leader_1.tryBecomeLeader)()) {
                    await (0, leader_2.updateLeader)(this.instanceId);
                    (0, logger_1.default)('Refreshed leadership');
                }
                else {
                    this.isLeader = false;
                    (0, logger_1.default)('Lost leadership');
                }
                return;
            }
            if (!currentLeader && await (0, leader_1.tryBecomeLeader)()) {
                this.isLeader = true;
                await (0, leader_2.updateLeader)(this.instanceId);
                (0, logger_1.default)('Became leader');
            }
        }
        catch (error) {
            (0, logger_1.default)(`Error in election process: ${error}`);
        }
    }
    start() {
        (0, logger_1.default)('Starting election process');
        this.checkLeadership();
        this.intervalHandle = setInterval(() => this.checkLeadership(), this.checkInterval);
    }
    stop() {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = undefined;
            (0, logger_1.default)('Stopped election process');
        }
    }
}
const election = new LeaderElection();
election.start();
exports.default = election;

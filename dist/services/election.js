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
    lastCheckTime = 0;
    refreshInterval;
    checkInterval;
    instanceId;
    intervalHandle;
    constructor() {
        this.refreshInterval = Math.floor(config_1.LEADER_TTL * config_1.LEADER_REFRESH_RATIO) * 1000;
        this.checkInterval = Math.floor(config_1.LEADER_TTL * config_1.FOLLOWER_CHECK_RATIO) * 1000;
        this.instanceId = process.env.FLY_MACHINE_ID;
        if (!this.instanceId) {
            throw new Error('FLY_MACHINE_ID must be set');
        }
        (0, logger_1.default)(`Initialized with refresh: ${this.refreshInterval}ms, check: ${this.checkInterval}ms`);
    }
    setLeaderState(isLeader) {
        if (this.isLeader !== isLeader) {
            this.isLeader = isLeader;
            (0, logger_1.default)(`Leadership state changed to: ${isLeader ? 'leader' : 'follower'}`);
            this.updateInterval();
        }
    }
    updateInterval() {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            (0, logger_1.default)('Cleared previous interval');
        }
        const interval = this.isLeader ? this.refreshInterval : this.checkInterval;
        this.intervalHandle = setInterval(async () => {
            try {
                await this.checkLeadership();
            }
            catch (error) {
                (0, logger_1.default)(`Error in interval check: ${error}`);
            }
        }, interval);
        (0, logger_1.default)(`Set new interval: ${interval}ms (${this.isLeader ? 'leader' : 'follower'} mode)`);
    }
    async refreshLeadership() {
        try {
            const success = await (0, leader_1.tryBecomeLeader)();
            if (success) {
                await (0, leader_2.updateLeader)(this.instanceId);
                this.lastCheckTime = Date.now();
                (0, logger_1.default)('Successfully refreshed leadership');
            }
            else {
                (0, logger_1.default)(`Failed to refresh leadership`);
                this.setLeaderState(false);
            }
        }
        catch (error) {
            (0, logger_1.default)(`Error in refreshLeadership: ${error}`);
            this.setLeaderState(false);
        }
    }
    async attemptLeadership() {
        try {
            const currentLeader = await (0, leader_1.getRedisLeader)();
            if (!currentLeader) {
                const success = await (0, leader_1.tryBecomeLeader)();
                if (success) {
                    await (0, leader_2.updateLeader)(this.instanceId);
                    this.setLeaderState(true);
                    (0, logger_1.default)('Successfully claimed leadership');
                }
            }
            this.lastCheckTime = Date.now();
        }
        catch (error) {
            (0, logger_1.default)(`Error in attemptLeadership: ${error}`);
        }
    }
    async checkLeadership() {
        const now = Date.now();
        const interval = this.isLeader ? this.refreshInterval : this.checkInterval;
        if (now - this.lastCheckTime < interval) {
            return;
        }
        if (this.isLeader) {
            await this.refreshLeadership();
        }
        else {
            await this.attemptLeadership();
        }
    }
    start() {
        (0, logger_1.default)('Starting leader election process');
        this.checkLeadership().catch(error => {
            (0, logger_1.default)(`Error in initial leadership check: ${error}`);
        });
        this.updateInterval();
    }
    stop() {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = undefined;
            (0, logger_1.default)('Stopped leader election process');
        }
    }
}
const election = new LeaderElection();
// Handle process shutdown gracefully
process.on('SIGTERM', () => {
    (0, logger_1.default)('Received SIGTERM signal');
    election.stop();
});
process.on('SIGINT', () => {
    (0, logger_1.default)('Received SIGINT signal');
    election.stop();
});
election.start();
exports.default = election;

import { tryBecomeLeader, getRedisLeader } from "../redis/leader";
import { updateLeader, getCurrentLeader } from "../db/leader";
import logEvent from "../utils/logger";
import { LEADER_TTL, FAILOVER_THRESHOLD, LEADER_REFRESH_RATIO, FOLLOWER_CHECK_RATIO } from "../config";

class LeaderElection {
    private isLeader: boolean = false;
    private lastCheckTime: number = 0;
    private readonly refreshInterval: number;
    private readonly checkInterval: number;
    private readonly instanceId: string;
    private intervalHandle?: NodeJS.Timeout;

    constructor() {
        this.refreshInterval = Math.floor(LEADER_TTL * LEADER_REFRESH_RATIO) * 1000;
        this.checkInterval = Math.floor(LEADER_TTL * FOLLOWER_CHECK_RATIO) * 1000;
        this.instanceId = process.env.FLY_MACHINE_ID!;

        if (!this.instanceId) {
            throw new Error('FLY_MACHINE_ID must be set');
        }

        logEvent(`Initialized with refresh: ${this.refreshInterval}ms, check: ${this.checkInterval}ms`);
    }

    private setLeaderState(isLeader: boolean): void {
        if (this.isLeader !== isLeader) {
            this.isLeader = isLeader;
            logEvent(`Leadership state changed to: ${isLeader ? 'leader' : 'follower'}`);
            this.updateInterval();
        }
    }

    private updateInterval(): void {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            logEvent('Cleared previous interval');
        }

        const interval = this.isLeader ? this.refreshInterval : this.checkInterval;
        this.intervalHandle = setInterval(async () => {
            try {
                await this.checkLeadership();
            } catch (error) {
                logEvent(`Error in interval check: ${error}`);
            }
        }, interval);

        logEvent(`Set new interval: ${interval}ms (${this.isLeader ? 'leader' : 'follower'} mode)`);
    }

    private async refreshLeadership(): Promise<void> {
        try {
            const success = await tryBecomeLeader();
            if (success) {
                await updateLeader(this.instanceId);
                this.lastCheckTime = Date.now();
                logEvent('Successfully refreshed leadership');
            } else {
                logEvent(`Failed to refresh leadership`);
                this.setLeaderState(false);
            }
        } catch (error) {
            logEvent(`Error in refreshLeadership: ${error}`);
            this.setLeaderState(false);
        }
    }

    private async attemptLeadership(): Promise<void> {
        try {
            const currentLeader = await getRedisLeader();
            
            if (!currentLeader) {
                const success = await tryBecomeLeader();
                if (success) {
                    await updateLeader(this.instanceId);
                    this.setLeaderState(true);
                    logEvent('Successfully claimed leadership');
                }
            }
            
            this.lastCheckTime = Date.now();
        } catch (error) {
            logEvent(`Error in attemptLeadership: ${error}`);
        }
    }

    public async checkLeadership(): Promise<void> {
        const now = Date.now();
        const interval = this.isLeader ? this.refreshInterval : this.checkInterval;

        if (now - this.lastCheckTime < interval) {
            return;
        }

        if (this.isLeader) {
            await this.refreshLeadership();
        } else {
            await this.attemptLeadership();
        }
    }

    public start(): void {
        logEvent('Starting leader election process');
        this.checkLeadership().catch(error => {
            logEvent(`Error in initial leadership check: ${error}`);
        });
        this.updateInterval();
    }

    public stop(): void {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = undefined;
            logEvent('Stopped leader election process');
        }
    }
}

const election = new LeaderElection();

// Handle process shutdown gracefully
process.on('SIGTERM', () => {
    logEvent('Received SIGTERM signal');
    election.stop();
});

process.on('SIGINT', () => {
    logEvent('Received SIGINT signal');
    election.stop();
});

election.start();

export default election;

import { tryBecomeLeader, getLeaderInfo, updateLeaderHeartbeat } from "../redis/leader";
import { recordLeaderEvent } from "../db/leader-history";
import logEvent from "../utils/logger";
import { LEADER_TTL, INSTANCE_ID } from "../config";

class LeaderElection {
    private isLeader: boolean = false;
    private intervalHandle?: NodeJS.Timeout;
    private readonly instanceId: string;
    private readonly checkInterval: number;

    constructor() {
        this.instanceId = INSTANCE_ID;
        this.checkInterval = Math.floor(LEADER_TTL * 0.5) * 1000;
    }

    private async checkLeadership(): Promise<void> {
        try {
            const leaderInfo = await getLeaderInfo();

            if (this.isLeader) {
                if (!await updateLeaderHeartbeat()) {
                    this.isLeader = false;
                    await recordLeaderEvent(this.instanceId, 'LOST');
                    logEvent(`${this.instanceId} Lost leadership`);
                }
                return;
            }

            const now = Date.now();
            const isStale = !leaderInfo || (now - leaderInfo.lastHeartbeat) > (LEADER_TTL * 1000);

            if (isStale && await tryBecomeLeader()) {
                this.isLeader = true;
                await recordLeaderEvent(this.instanceId, 'ELECTED');
                logEvent(`${this.instanceId} Became leader`);
            }
        } catch (error) {
            logEvent(`Error in election process: ${error}`);
        }
    }

    public start(): void {
        logEvent('Starting election process');
        this.checkLeadership();
        this.intervalHandle = setInterval(() => this.checkLeadership(), this.checkInterval);
    }

    public stop(): void {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = undefined;
            logEvent('Stopped election process');
        }
    }
}

const election = new LeaderElection();
election.start();

export default election;

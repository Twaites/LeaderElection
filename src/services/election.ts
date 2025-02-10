import { tryBecomeLeader, getRedisLeader } from "../redis/leader";
import { updateLeader } from "../db/leader";
import logEvent from "../utils/logger";
import { LEADER_TTL, INSTANCE_ID } from "../config";
import { recordLeaderEvent } from "../db/leader-history";

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
            const currentLeader = await getRedisLeader();

            if (this.isLeader) {
                if (await tryBecomeLeader()) {
                    await updateLeader(this.instanceId);
                    await recordLeaderEvent(this.instanceId, 'REFRESH');
                    logEvent('Refreshed leadership');
                } else {
                    this.isLeader = false;
                    await recordLeaderEvent(this.instanceId, 'LOST', {
                        newLeader: currentLeader
                    });
                    logEvent('Lost leadership');
                }
                return;
            }

            if (!currentLeader && await tryBecomeLeader()) {
                this.isLeader = true;
                await updateLeader(this.instanceId);
                await recordLeaderEvent(this.instanceId, 'ELECTED');
                logEvent('Became leader');
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

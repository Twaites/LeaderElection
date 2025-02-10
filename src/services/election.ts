import { tryBecomeLeader, getRedisLeader } from "../redis/leader";
import { updateLeader } from "../db/leader";
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
            const currentLeader = await getRedisLeader();

            if (this.isLeader) {
                if (await tryBecomeLeader()) {
                    await updateLeader(this.instanceId);
                    logEvent('Refreshed leadership');
                } else {
                    this.isLeader = false;
                    logEvent('Lost leadership');
                }
                return;
            }

            if (!currentLeader && await tryBecomeLeader()) {
                this.isLeader = true;
                await updateLeader(this.instanceId);
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

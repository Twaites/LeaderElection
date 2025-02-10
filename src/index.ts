import dotenv from "dotenv";
import election from "./services/election";
import { INSTANCE_ID } from "./config";

dotenv.config();

console.log(`Server ${INSTANCE_ID} is starting...`);

// Keep the process alive
process.stdin.resume();

// Handle shutdown gracefully
process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Shutting down...');
    election.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down...');
    election.stop();
    process.exit(0);
});

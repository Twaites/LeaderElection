import dotenv from "dotenv";
import election from "./services/election";

dotenv.config();

console.log(`Server ${process.env.FLY_MACHINE_ID} is starting...`);

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

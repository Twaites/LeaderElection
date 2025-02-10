"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const election_1 = __importDefault(require("./services/election"));
dotenv_1.default.config();
console.log(`Server ${process.env.FLY_MACHINE_ID} is starting...`);
// Keep the process alive
process.stdin.resume();
// Handle shutdown gracefully
process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Shutting down...');
    election_1.default.stop();
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down...');
    election_1.default.stop();
    process.exit(0);
});

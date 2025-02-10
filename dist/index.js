"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const election_1 = require("./services/election");
dotenv_1.default.config();
console.log(`Server ${process.env.SERVER_ID} is starting...`);
(0, election_1.electLeader)();

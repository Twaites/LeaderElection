import dotenv from "dotenv";
import { electLeader } from "./services/election";

dotenv.config();

console.log(`Server ${process.env.SERVER_ID} is starting...`);
electLeader();

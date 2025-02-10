import dotenv from "dotenv";
import election from "./services/election";

dotenv.config();

console.log(`Server ${process.env.FLY_MACHINE_ID} is starting...`);

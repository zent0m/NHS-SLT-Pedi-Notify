import * as dotenv from "dotenv";
import { JobDatabase } from "./database";

dotenv.config();

const db = new JobDatabase();
db.clearAll();
console.log("Database cleared!");
process.exit(0);

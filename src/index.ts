import * as dotenv from "dotenv";
import { JobScheduler } from "./scheduler";

dotenv.config();

const mode = process.argv[2] || "once";

const scheduler = new JobScheduler();

process.on("SIGINT", () => {
  console.log("\nShutting down...");
  scheduler.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down...");
  scheduler.stop();
  process.exit(0);
});

if (mode === "schedule") {
  scheduler.startScheduled();
} else {
  scheduler.start().then(() => {
    console.log("Run complete. Use 'npm run start:schedule' for scheduled checks.");
    process.exit(0);
  });
}

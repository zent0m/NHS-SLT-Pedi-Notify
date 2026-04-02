import * as dotenv from "dotenv";
import * as http from "http";
import { JobScheduler } from "./scheduler";

dotenv.config();

const PORT = process.env.PORT || "3000";
const mode = process.argv[2] || "once";

const scheduler = new JobScheduler();

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("NHS SLT Pediatric Job Monitor is running");
});

server.listen(PORT, () => {
  console.log(`Web server listening on port ${PORT}`);
});

process.on("SIGINT", () => {
  console.log("\nShutting down...");
  scheduler.stop();
  server.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down...");
  scheduler.stop();
  server.close();
  process.exit(0);
});

if (mode === "schedule") {
  scheduler.startScheduled();
} else {
  scheduler.start().then(() => {
    console.log("Run complete. Use 'npm run start:schedule' for scheduled checks.");
  });
}

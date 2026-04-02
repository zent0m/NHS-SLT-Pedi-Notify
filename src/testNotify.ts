import * as dotenv from "dotenv";
import { config } from "./config";
import { NotificationService } from "./notifications";
import { Job } from "./types";

dotenv.config();

const testJob: Job = {
  jobId: "TEST-001",
  title: "Speech & Language Therapist - Band 5",
  jobReference: "TEST-REF-001",
  employerName: "Test NHS Trust",
  location: "London, SW1 1AA",
  salary: "£31,049 to £37,796",
  contractType: "Permanent",
  publicationDate: new Date().toISOString(),
  closingDate: "2026-04-15",
  description: "Are you a Speech and Language Therapist looking to work with children? We have an exciting opportunity to join our paediatric team working with children and young people in the community.",
  link: "https://www.jobs.nhs.uk/candidate/jobadvert/TEST-001",
  payBand: "BAND_5",
  isPediatric: true,
  matchedSentence: "...to work with children in the community...",
  distanceFromBirmingham: 130,
  distanceFromNottingham: 120,
  notified: false,
  createdAt: new Date().toISOString(),
};

async function sendTestNotification() {
  console.log("Sending test notification...");
  
  const notificationService = new NotificationService();
  await notificationService.sendNotifications([testJob]);
  
  console.log("Test complete!");
  process.exit(0);
}

sendTestNotification();

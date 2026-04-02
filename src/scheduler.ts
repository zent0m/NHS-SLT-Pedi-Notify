import * as cron from "node-cron";
import { NhsJobsClient } from "./nhsJobsClient";
import { JobFilter } from "./jobFilter";
import { JobDatabase } from "./database";
import { NotificationService } from "./notifications";
import { config } from "./config";

export class JobScheduler {
  private client: NhsJobsClient;
  private filter: JobFilter;
  private database: JobDatabase;
  private notifications: NotificationService;
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    this.client = new NhsJobsClient();
    this.filter = new JobFilter();
    this.database = new JobDatabase();
    this.notifications = new NotificationService();
  }

  async checkForNewJobs(): Promise<void> {
    console.log(`\n[${new Date().toISOString()}] Checking for new pediatric SLT Band 5 jobs...`);

    try {
      const allJobs = await this.client.fetchJobs();
      console.log(`Found ${allJobs.length} total jobs from API`);

      if (allJobs.length === 0) {
        return;
      }

      const sltJobs = this.filter.filterSLTJobs(allJobs);
      console.log(`Found ${sltJobs.length} SLT jobs (title check)`);
      
      console.log(`Fetching full descriptions for ${sltJobs.length} SLT jobs...`);
      
      for (const job of sltJobs) {
        const fullDesc = await this.client.fetchFullJobDetails(job);
        job.description = fullDesc;
      }
      
      const pediatricJobs = await this.filter.filterPediatricJobs(sltJobs);
      const newPediatricJobs = pediatricJobs.filter(
        (job) => job.isPediatric && !this.database.jobExists(job.jobId)
      );
      
      const totalPediatric = pediatricJobs.filter(j => j.isPediatric).length;
      console.log(`Found ${totalPediatric} pediatric SLT jobs, ${newPediatricJobs.length} new`);

      if (newPediatricJobs.length > 0) {
        this.database.saveJobs(newPediatricJobs);
        
        const jobsToNotify = this.database.getUnnotifiedJobs();
        
        if (jobsToNotify.length > 0) {
          await this.notifications.sendNotifications(jobsToNotify);
          this.database.markAsNotifiedBatch(jobsToNotify.map(j => j.jobId));
        }
      }

      console.log(`Job check complete. Total tracked: ${this.database.getAllJobs().length}`);
    } catch (error) {
      console.error("Error during job check:", error);
    }
  }

  async start(): Promise<void> {
    console.log("Starting NHS SLT Pediatric Job Monitor...");
    
    await this.checkForNewJobs();
    
    console.log("Check complete.");
  }

  startScheduled(): void {
    console.log("Starting NHS SLT Pediatric Job Monitor...");
    console.log(`Scheduler running: ${config.scheduler.cronExpression}`);
    
    this.checkForNewJobs();
    
    this.cronJob = cron.schedule(config.scheduler.cronExpression, async () => {
      await this.checkForNewJobs();
    });

    console.log("Initial check complete. Waiting for scheduled checks...");
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
    }
    this.database.close();
    console.log("Scheduler stopped");
  }
}

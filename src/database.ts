import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";
import { config } from "./config";
import { Job } from "./types";

export class JobDatabase {
  private db: Database.Database;

  constructor() {
    const dbPath = config.database.path;
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        jobId TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        jobReference TEXT,
        employerName TEXT,
        location TEXT,
        salary TEXT,
        contractType TEXT,
        publicationDate TEXT,
        closingDate TEXT,
        description TEXT,
        link TEXT,
        payBand TEXT,
        isPediatric INTEGER DEFAULT 0,
        matchedSentence TEXT,
        distanceFromBirmingham REAL,
        distanceFromNottingham REAL,
        notified INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL
      )
    `);

    try { this.db.exec(`ALTER TABLE jobs ADD COLUMN matchedSentence TEXT`); } catch {}
    try { this.db.exec(`ALTER TABLE jobs ADD COLUMN distanceFromBirmingham REAL`); } catch {}
    try { this.db.exec(`ALTER TABLE jobs ADD COLUMN distanceFromNottingham REAL`); } catch {}

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_notified ON jobs(notified);
      CREATE INDEX IF NOT EXISTS idx_pediatric ON jobs(isPediatric);
    `);

    console.log("Database initialized");
  }

  saveJob(job: Job): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO jobs (
        jobId, title, jobReference, employerName, location, salary,
        contractType, publicationDate, closingDate,
        description, link, payBand, isPediatric, matchedSentence,
        distanceFromBirmingham, distanceFromNottingham, notified, createdAt
      ) VALUES (
        @jobId, @title, @jobReference, @employerName, @location, @salary,
        @contractType, @publicationDate, @closingDate,
        @description, @link, @payBand, @isPediatric, @matchedSentence,
        @distanceFromBirmingham, @distanceFromNottingham, @notified, @createdAt
      )
    `);

    stmt.run({
      ...job,
      isPediatric: job.isPediatric ? 1 : 0,
      notified: job.notified ? 1 : 0,
    });
  }

  saveJobs(jobs: Job[]): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO jobs (
        jobId, title, jobReference, employerName, location, salary,
        contractType, publicationDate, closingDate,
        description, link, payBand, isPediatric, matchedSentence,
        distanceFromBirmingham, distanceFromNottingham, notified, createdAt
      ) VALUES (
        @jobId, @title, @jobReference, @employerName, @location, @salary,
        @contractType, @publicationDate, @closingDate,
        @description, @link, @payBand, @isPediatric, @matchedSentence,
        @distanceFromBirmingham, @distanceFromNottingham, @notified, @createdAt
      )
    `);

    const insertMany = this.db.transaction((jobs: Job[]) => {
      for (const job of jobs) {
        stmt.run({
          ...job,
          isPediatric: job.isPediatric ? 1 : 0,
          notified: job.notified ? 1 : 0,
        });
      }
    });

    insertMany(jobs);
    console.log(`Saved ${jobs.length} jobs to database`);
  }

  jobExists(jobId: string): boolean {
    const stmt = this.db.prepare("SELECT 1 FROM jobs WHERE jobId = ?");
    return !!stmt.get(jobId);
  }

  getUnnotifiedJobs(): Job[] {
    const stmt = this.db.prepare(`
      SELECT * FROM jobs WHERE isPediatric = 1 AND notified = 0
    `);
    return stmt.all() as Job[];
  }

  markAsNotified(jobId: string): void {
    const stmt = this.db.prepare(`
      UPDATE jobs SET notified = 1 WHERE jobId = ?
    `);
    stmt.run(jobId);
  }

  markAsNotifiedBatch(jobIds: string[]): void {
    const stmt = this.db.prepare(`
      UPDATE jobs SET notified = 1 WHERE jobId = ?
    `);

    const updateMany = this.db.transaction((jobIds: string[]) => {
      for (const jobId of jobIds) {
        stmt.run(jobId);
      }
    });

    updateMany(jobIds);
    console.log(`Marked ${jobIds.length} jobs as notified`);
  }

  getAllJobs(): Job[] {
    const stmt = this.db.prepare("SELECT * FROM jobs ORDER BY createdAt DESC");
    return stmt.all() as Job[];
  }

  clearAll(): void {
    this.db.exec("DELETE FROM jobs");
    console.log("All jobs cleared from database");
  }

  close(): void {
    this.db.close();
  }
}

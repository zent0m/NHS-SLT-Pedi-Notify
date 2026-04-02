import nodemailer from "nodemailer";
import { config } from "./config";
import { Job } from "./types";

export class NotificationService {
  private emailTransporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeEmail();
  }

  private initializeEmail(): void {
    if (!config.email.enabled) {
      console.log("Email notifications disabled");
      return;
    }

    const { host, port, secure, auth } = config.email;
    if (host && auth.user && auth.pass) {
      this.emailTransporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: auth.user,
          pass: auth.pass,
        },
      });
      console.log("Email transporter initialized");
    } else {
      console.warn("Email is enabled but credentials are missing");
    }
  }

  async sendNotifications(jobs: Job[]): Promise<void> {
    if (jobs.length === 0) {
      console.log("No jobs to notify about");
      return;
    }

    if (!this.emailTransporter) {
      console.warn("Email not configured");
      return;
    }

    console.log(`Sending email for ${jobs.length} new pediatric SLT Band 5 jobs`);

    const { from, to } = config.email;
    const recipients = Array.isArray(to) ? to : [to];
    const subject = `New Pediatric SLT Band 5 Jobs - ${jobs.length} new position${jobs.length > 1 ? "s" : ""}`;
    const body = this.formatEmailBody(jobs);

    const sendPromises = recipients.map(recipient => 
      this.emailTransporter!.sendMail({
        from,
        to: recipient,
        subject,
        html: body,
      })
    );

    try {
      await Promise.all(sendPromises);
      console.log(`Email notification sent to ${recipients.length} recipients`);
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  }

  private formatEmailBody(jobs: Job[]): string {
    let html = `
      <h2>New Pediatric SLT Band 5 Job${jobs.length > 1 ? "s" : ""} Found!</h2>
      <p>${jobs.length} new pediatric Speech & Language Therapist Band 5 position${jobs.length > 1 ? "s" : ""} available:</p>
      <hr>
    `;

    for (const job of jobs) {
      const distBham = job.distanceFromBirmingham !== null ? `~${job.distanceFromBirmingham} miles` : "N/A";
      const distNotts = job.distanceFromNottingham !== null ? `~${job.distanceFromNottingham} miles` : "N/A";
      
      html += `
        <h3>${job.title}</h3>
        <p><strong>Employer:</strong> ${job.employerName}</p>
        <p><strong>Location:</strong> ${job.location}</p>
        <p><strong>Distance from Birmingham:</strong> ${distBham}</p>
        <p><strong>Distance from Nottingham:</strong> ${distNotts}</p>
        <p><strong>Salary:</strong> ${job.salary}</p>
        <p><strong>Band:</strong> ${job.payBand}</p>
        <p><strong>Contract:</strong> ${job.contractType}</p>
        <p><strong>Published:</strong> ${job.publicationDate}</p>
        <p><strong>Closing Date:</strong> ${job.closingDate}</p>
        <p style="color: #666; font-style: italic;"><strong>Matched:</strong> ${job.matchedSentence}</p>
        <p><a href="${job.link}">Apply Now</a></p>
        <hr>
      `;
    }

    html += `
      <p style="color: #666; font-size: 12px;">
        This is an automated notification from NHS SLT Pediatric Job Monitor.
      </p>
    `;

    return html;
  }
}

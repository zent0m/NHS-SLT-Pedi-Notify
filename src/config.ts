import * as dotenv from "dotenv";
dotenv.config();

export interface Config {
  nhsJobs: {
    apiBaseUrl: string;
    keyword: string;
    payBand: string;
    sort: string;
    limit: number;
  };
  database: {
    path: string;
  };
  email: {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    from: string;
    to: string | string[];
  };
  scheduler: {
    cronExpression: string;
  };
}

function getEnv(key: string, defaultValue: string = ""): string {
  return process.env[key] || defaultValue;
}

export const config: Config = {
  nhsJobs: {
    apiBaseUrl: "https://www.jobs.nhs.uk/api/v1/search_xml",
    keyword: "speech language therapist",
    payBand: "BAND_5",
    sort: "publicationDateDesc",
    limit: 100,
  },
  database: {
    path: "./data/jobs.db",
  },
  email: {
    enabled: getEnv("EMAIL_ENABLED") === "true",
    host: getEnv("EMAIL_HOST", "smtp.gmail.com"),
    port: parseInt(getEnv("EMAIL_PORT", "587")),
    secure: getEnv("EMAIL_SECURE") === "true",
    auth: {
      user: getEnv("EMAIL_USER"),
      pass: getEnv("EMAIL_PASS"),
    },
    from: getEnv("EMAIL_FROM"),
    to: getEnv("EMAIL_TO", "").split(",").map(e => e.trim()).filter(Boolean),
  },
  scheduler: {
    cronExpression: getEnv("CRON_EXPRESSION", "*/15 * * * *"),
  },
};

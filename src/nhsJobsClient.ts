import axios from "axios";
import xml2js from "xml2js";
import { config } from "./config";
import { Job, NhsApiResponse, NhsVacancy } from "./types";

export class NhsJobsClient {
  private baseUrl: string;
  private parser: xml2js.Parser;

  constructor() {
    this.baseUrl = config.nhsJobs.apiBaseUrl;
    this.parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
    });
  }

  async fetchJobs(): Promise<Job[]> {
    try {
      const url = this.buildUrl(1);
      console.log(`Fetching jobs from: ${url}`);

      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          Accept: "application/xml",
        },
      });

      const jobs = await this.parseResponse(response.data);
      const totalResults = await this.getTotalResults(response.data);
      const totalPages = Math.ceil(totalResults / config.nhsJobs.limit);
      
      if (totalPages > 1) {
        console.log(`Fetching remaining ${totalPages - 1} pages...`);
        const allPagePromises: Promise<Job[]>[] = [];
        for (let page = 2; page <= totalPages; page++) {
          allPagePromises.push(this.fetchJobsPage(page, true));
        }
        const additionalJobs = await Promise.all(allPagePromises);
        const allJobs = jobs.concat(...additionalJobs);
        console.log(`Total jobs fetched: ${allJobs.length}`);
        return allJobs;
      }
      
      console.log(`Total jobs fetched: ${jobs.length}`);
      return jobs;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error fetching jobs:", error.message);
      } else {
        console.error("Error fetching jobs:", error);
      }
      return [];
    }
  }

  private async getTotalResults(data: any): Promise<number> {
    try {
      const parsed = await this.parser.parseStringPromise(data);
      return parseInt(parsed.nhsJobs?.totalResults) || 0;
    } catch {
      return 0;
    }
  }

  async fetchJobsPage(page: number, quiet: boolean = false): Promise<Job[]> {
    try {
      const url = this.buildUrl(page);
      if (!quiet) console.log(`Fetching jobs from: ${url}`);

      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          Accept: "application/xml",
        },
      });

      return await this.parseResponse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error fetching jobs:", error.message);
      } else {
        console.error("Error fetching jobs:", error);
      }
      return [];
    }
  }

  private async parseResponse(data: any): Promise<Job[]> {
    try {
      const parsed = await this.parser.parseStringPromise(data);
      const apiResponse = parsed.nhsJobs as NhsApiResponse;

      if (!apiResponse) {
        return [];
      }

      const vacancyData = apiResponse.vacancyDetails;
      
      if (!vacancyData) {
        return [];
      }

      const vacancies = Array.isArray(vacancyData) ? vacancyData : [vacancyData];

      return vacancies.map((v: NhsVacancy) => this.mapVacancyToJob(v));
    } catch {
      return [];
    }
  }

  private buildUrl(page: number = 1): string {
    const params = new URLSearchParams();
    params.append("keyword", config.nhsJobs.keyword);
    params.append("payBand", config.nhsJobs.payBand);
    params.append("sort", config.nhsJobs.sort);
    params.append("limit", config.nhsJobs.limit.toString());
    params.append("page", page.toString());

    return `${this.baseUrl}?${params.toString()}`;
  }

  private mapVacancyToJob(vacancy: NhsVacancy): Job {
    const location = Array.isArray(vacancy.locations?.location)
      ? vacancy.locations.location.join(", ")
      : vacancy.locations?.location || "";

    return {
      jobId: vacancy.id,
      title: vacancy.title,
      jobReference: vacancy.reference,
      employerName: vacancy.employer,
      location,
      salary: vacancy.salary,
      contractType: vacancy.type,
      publicationDate: vacancy.postDate,
      closingDate: vacancy.closeDate,
      description: vacancy.description,
      link: vacancy.url,
      payBand: config.nhsJobs.payBand,
      isPediatric: false,
      matchedSentence: "",
      distanceFromBirmingham: null,
      distanceFromNottingham: null,
      notified: false,
      createdAt: new Date().toISOString(),
    };
  }

  async fetchFullJobDetails(job: Job): Promise<string> {
    try {
      const response = await axios.get(job.link, {
        timeout: 15000,
      });
      
      const fullText: string = response.data;
      
      const bodyStart = fullText.indexOf('<body');
      const bodyEnd = fullText.indexOf('</body>');
      if (bodyStart >= 0 && bodyEnd > bodyStart) {
        const bodyContent = fullText.substring(bodyStart, bodyEnd);
        const text = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        const text2 = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        const text3 = text2.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return text3.substring(0, 5000);
      }
      
      return job.description;
    } catch {
      return job.description;
    }
  }
}

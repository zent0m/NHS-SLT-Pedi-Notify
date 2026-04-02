import axios from "axios";
import { Job } from "./types";

interface PediatricMatch {
  isPediatric: boolean;
  matchedSentence: string;
}

export class JobFilter {
  private pediatricKeywords: string[] = [
    "child", "children", "childhood", "pediatric", "paediatric",
    "pediatrics", "paediatrics", "baby", "babies", "toddler", "toddlers",
    "infant", "infants", "young people", "youth", "school age", "pre-school",
    "preschool", "primary school", "early years", "education", "cch",
    "community child health", "cyp", "children and young people", "paediatric",
  ];

  private geocodeCache = new Map<string, string | null>();
  private distanceCache = new Map<string, number | null>();
  private birminghamCoords = "-1.9025,52.4797";
  private nottinghamCoords = "-1.1581,52.9553";

  isSLTJob(job: Job): boolean {
    const titleLower = job.title.toLowerCase();
    const sltKeywords = ["speech", "language", "slt", "slp"];
    return sltKeywords.some(k => titleLower.includes(k));
  }

  checkPediatric(job: Job): PediatricMatch {
    const titleLower = job.title.toLowerCase();
    const descLower = job.description.toLowerCase();
    
    const hasSLT = this.isSLTJob(job);
    
    if (!hasSLT) {
      return { isPediatric: false, matchedSentence: "" };
    }

    for (const keyword of this.pediatricKeywords) {
      const idx = descLower.indexOf(keyword);
      if (idx >= 0) {
        const start = Math.max(0, idx - 30);
        const end = Math.min(descLower.length, idx + keyword.length + 50);
        let sentence = descLower.substring(start, end);
        sentence = sentence.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        
        return { isPediatric: true, matchedSentence: "..." + sentence + "..." };
      }
    }

    return { isPediatric: false, matchedSentence: "" };
  }

  async calculateDistance(fromCity: string, toLocation: string): Promise<number | null> {
    const cacheKey = `${fromCity}:${toLocation}`;
    if (this.distanceCache.has(cacheKey)) {
      return this.distanceCache.get(cacheKey) ?? null;
    }

    try {
      const coords = await this.geocodeLocation(toLocation);
      if (!coords) {
        this.distanceCache.set(cacheKey, null);
        return null;
      }

      const fromCoords = fromCity.toLowerCase() === "birmingham" 
        ? this.birminghamCoords 
        : this.nottinghamCoords;

      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${fromCoords};${coords}`,
        { timeout: 5000 }
      );

      if (response.data.routes && response.data.routes.length > 0) {
        const distanceKm = response.data.routes[0].distance / 1000;
        const miles = Math.round(distanceKm * 0.621371);
        this.distanceCache.set(cacheKey, miles);
        return miles;
      }

      this.distanceCache.set(cacheKey, null);
      return null;
    } catch {
      this.distanceCache.set(cacheKey, null);
      return null;
    }
  }

  private async geocodeLocation(location: string): Promise<string | null> {
    const cleanLocation = location.split(',')[0].trim();
    
    if (this.geocodeCache.has(cleanLocation)) {
      return this.geocodeCache.get(cleanLocation) ?? null;
    }

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: {
            q: cleanLocation + ", UK",
            format: "json",
            limit: 1,
          },
          timeout: 5000,
          headers: {
            "User-Agent": "NHS-SLT-Pedi-Notify/1.0",
          },
        }
      );

      let coords: string | null = null;
      if (response.data && response.data.length > 0) {
        coords = `${response.data[0].lon},${response.data[0].lat}`;
      }
      
      this.geocodeCache.set(cleanLocation, coords);
      return coords;
    } catch {
      this.geocodeCache.set(cleanLocation, null);
      return null;
    }
  }

  filterSLTJobs(jobs: Job[]): Job[] {
    return jobs.filter(job => this.isSLTJob(job));
  }

  async filterPediatricJobs(jobs: Job[]): Promise<Job[]> {
    const results: Job[] = [];
    
    for (const job of jobs) {
      const { isPediatric, matchedSentence } = this.checkPediatric(job);
      
      let distanceBirmingham: number | null = null;
      let distanceNottingham: number | null = null;

      if (isPediatric) {
        [distanceBirmingham, distanceNottingham] = await Promise.all([
          this.calculateDistance("birmingham", job.location),
          this.calculateDistance("nottingham", job.location),
        ]);
      }
      
      results.push({
        ...job,
        isPediatric,
        matchedSentence,
        distanceFromBirmingham: distanceBirmingham,
        distanceFromNottingham: distanceNottingham,
      });
    }
    
    return results;
  }
}

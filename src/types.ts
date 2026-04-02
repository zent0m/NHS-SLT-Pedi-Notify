export interface Job {
  jobId: string;
  title: string;
  jobReference: string;
  employerName: string;
  location: string;
  salary: string;
  contractType: string;
  publicationDate: string;
  closingDate: string;
  description: string;
  link: string;
  payBand: string;
  isPediatric: boolean;
  matchedSentence: string;
  distanceFromBirmingham: number | null;
  distanceFromNottingham: number | null;
  notified: boolean;
  createdAt: string;
}

export interface NhsApiResponse {
  vacancyDetails: NhsVacancy[] | NhsVacancy;
  totalPages: number;
  totalResults: number;
}

export interface NhsVacancy {
  id: string;
  reference: string;
  title: string;
  description: string;
  employer: string;
  type: string;
  salary: string;
  closeDate: string;
  postDate: string;
  url: string;
  locations: {
    location: string | string[];
  };
}

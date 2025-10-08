export type DataStatusVideo = {
  name: string;
  done: boolean;
  response?: {
    "@type": string;
    raiMediaFilteredCount: number;
    videos?: { gcsUri: string; mimeType: string }[];
  };
};

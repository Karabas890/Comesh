export type User = {
  id: string;
  name: string;
  email: string;
  role: "COMPANY" | "RESPONDENT" | "ADMIN";
  organization?: { name: string };
  profile?: {
    age: number;
    gender: string;
    region: string;
    interests: string[];
    categories: string[];
    brands: string[];
  };
};
export type Question = {
  id: string;
  text: string;
  type: "SINGLE" | "MULTIPLE" | "RATING" | "TEXT" | "YESNO";
  required: boolean;
  scale: number;
  options: { id: string; text: string }[];
};
export type Study = {
  id: string;
  title: string;
  description: string;
  brand: string;
  category: string;
  objective: string;
  visibility: string;
  sharedReleased: boolean;
  status: string;
  reward: number;
  minutes: number;
  responses: number;
  createdAt: string;
  state?: string;
  target: {
    minAge: number;
    maxAge: number;
    gender: string;
    region: string;
    interests: string[];
    categories: string[];
  };
  questions: Question[];
  _count: { participants: number };
};
export type Quote = {
  answerId: string;
  questionId: string;
  respondentId: string;
  text: string;
  age: number;
  gender: string;
};
export type Analytics = {
  count: number;
  started: number;
  completionRate: number;
  demographics: Record<string, { name: string; count: number }[]>;
  activity: { day: string; count: number }[];
  questions: {
    id: string;
    text: string;
    type: string;
    average: number | null;
    distribution: { name: string; count: number }[];
  }[];
  quotes: Quote[];
};
export type Insight = {
  id: string;
  createdAt: string;
  model: string;
  result: {
    executiveSummary: string;
    keyInsights: string[];
    themes: string[];
    sentiment: { label: string; explanation: string };
    representativeQuotes: Quote[];
    recommendedActions: string[];
    limitations: string[];
    sampleSize: number;
  };
};

export interface RecommendedRole {
  role: string;
  fit_reason: string;
  keywords: string[];
}

export interface InterviewQuestion {
  question: string;
  focus_area: string;
  tip: string;
}

export interface ResumeAnalysis {
  ats_score: number;
  score_explanation: string;
  detected_role: string;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  missing_keywords: string[];
  keywords_to_add: string[];
  recommended_roles: RecommendedRole[];
  skill_improvements: string[];
  interview_questions: InterviewQuestion[];
}

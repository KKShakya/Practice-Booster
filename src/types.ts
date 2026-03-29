export type Subject = 'English' | 'Quants' | 'Reasoning';

export interface Question {
  id: number;
  text: string;
  correctAnswer: string;
  options?: string[];
}

export interface QuestionResult {
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  timeTaken: number; // in seconds
}

export interface PerformanceAnalysis {
  score: number;
  total: number;
  accuracy: number;
  averageSpeed: number;
  detailedNote: string;
  mistakesAnalysis?: string;
}

export type Phase = 'setup' | 'parsing' | 'practice' | 'analyzing' | 'results';

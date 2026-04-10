export type ExerciseType =
  | 'splits'
  | 'samenvoegen'
  | 'optellen'
  | 'aftrekken'
  | 'rij'
  | 'meerkeuze'
  | 'vermenigvuldigen'
  | 'delen'
  | 'meten'
  | 'breuken'
  | 'mixed';

export interface ExerciseVariation {
  id: string;
  exercise_id: string;
  problem: string;
  correct_answer: string;
  explanation: string | null;
  correct_option_index?: number;
  options?: string[];
  sequence?: (number | null)[];
  hints?: string[];
  workSteps?: string[];
}

export interface Exercise {
  id: string;
  title: string | null;
  description: string | null;
  exercise_type: ExerciseType;
  original_problem: string;
  grade_level: string;
  validation_status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  editor_notes: string | null;
  created_at: string;
  variations?: ExerciseVariation[];
}

export interface GenerateVariationsRequest {
  exerciseId: string;
  count: number;
  difficulty: 'easier' | 'same' | 'harder';
  maxNumber: 10 | 100 | 1000 | 10000;
  context?: 'getallen' | 'geld' | 'meten' | 'dieren';
}

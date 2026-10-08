export interface ISubmitGradePayload {
  enrollmentId: string;
  midtermMarks?: number;
  finalMarks?: number;
  assessmentMarks?: number;
  isPublished?: boolean;
}

export interface IGradeComputationResult {
  letterGrade: string;
  gradePoint: number;
}

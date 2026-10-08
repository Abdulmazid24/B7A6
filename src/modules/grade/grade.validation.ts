import { z } from "zod";

const submitGradeValidationSchema = z.object({
  body: z.object({
    enrollmentId: z.string().uuid("Valid enrollment ID is required"),
    midtermMarks: z.number().min(0).max(30, "Midterm marks cannot exceed 30").optional(),
    finalMarks: z.number().min(0).max(50, "Final marks cannot exceed 50").optional(),
    assessmentMarks: z.number().min(0).max(20, "Assessment marks cannot exceed 20").optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const GradeValidation = {
  submitGradeValidationSchema,
};

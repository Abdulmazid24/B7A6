import { z } from "zod";

const createCourseValidationSchema = z.object({
  body: z.object({
    code: z.string().min(3, "Course code is required (e.g. CSE101)").toUpperCase(),
    title: z.string().min(2, "Course title is required"),
    credits: z.number().int().min(1, "Credits must be at least 1").max(6, "Credits cannot exceed 6"),
    description: z.string().optional(),
    departmentId: z.string().uuid("Valid department ID is required"),
    prerequisiteIds: z.array(z.string().uuid()).optional(),
  }),
});

const updateCourseValidationSchema = z.object({
  body: z.object({
    code: z.string().min(3).toUpperCase().optional(),
    title: z.string().min(2).optional(),
    credits: z.number().int().min(1).max(6).optional(),
    description: z.string().optional(),
    departmentId: z.string().uuid().optional(),
    prerequisiteIds: z.array(z.string().uuid()).optional(),
  }),
});

export const CourseValidation = {
  createCourseValidationSchema,
  updateCourseValidationSchema,
};

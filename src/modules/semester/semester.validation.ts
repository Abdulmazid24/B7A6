import { z } from "zod";

const createSemesterValidationSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Semester name is required"),
    code: z.string().min(2, "Semester code is required").toUpperCase(),
    year: z.number().int().min(2020),
    startDate: z.string().datetime("Valid start date is required"),
    endDate: z.string().datetime("Valid end date is required"),
    isCurrent: z.boolean().optional(),
    isRegistrationOpen: z.boolean().optional(),
  }),
});

const updateSemesterValidationSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    code: z.string().min(2).toUpperCase().optional(),
    year: z.number().int().min(2020).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isCurrent: z.boolean().optional(),
    isRegistrationOpen: z.boolean().optional(),
  }),
});

export const SemesterValidation = {
  createSemesterValidationSchema,
  updateSemesterValidationSchema,
};

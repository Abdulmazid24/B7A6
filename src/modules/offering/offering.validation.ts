import { z } from "zod";

const createOfferingValidationSchema = z.object({
  body: z.object({
    courseId: z.string().uuid("Valid course ID is required"),
    semesterId: z.string().uuid("Valid semester ID is required"),
    initialSections: z
      .array(
        z.object({
          sectionNumber: z.number().int().min(1),
          capacity: z.number().int().min(5).max(100).default(30),
          roomNumber: z.string().optional(),
          schedule: z.string().optional(),
          facultyId: z.string().uuid().optional(),
        })
      )
      .optional(),
  }),
});

const createSectionValidationSchema = z.object({
  body: z.object({
    sectionNumber: z.number().int().min(1, "Section number is required"),
    capacity: z.number().int().min(5).max(100).default(30),
    roomNumber: z.string().optional(),
    schedule: z.string().optional(),
    facultyId: z.string().uuid().optional(),
  }),
});

const updateSectionValidationSchema = z.object({
  body: z.object({
    capacity: z.number().int().min(5).max(100).optional(),
    roomNumber: z.string().optional(),
    schedule: z.string().optional(),
    facultyId: z.string().uuid().nullable().optional(),
  }),
});

export const OfferingValidation = {
  createOfferingValidationSchema,
  createSectionValidationSchema,
  updateSectionValidationSchema,
};

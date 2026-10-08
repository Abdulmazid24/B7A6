import { z } from "zod";

const registerCourseValidationSchema = z.object({
  body: z.object({
    sectionId: z.string().uuid("Valid course section ID is required"),
  }),
});

const withdrawCourseValidationSchema = z.object({
  body: z.object({
    sectionId: z.string().uuid("Valid course section ID is required"),
  }),
});

export const EnrollmentValidation = {
  registerCourseValidationSchema,
  withdrawCourseValidationSchema,
};

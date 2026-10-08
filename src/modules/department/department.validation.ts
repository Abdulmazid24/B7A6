import { z } from "zod";

const createDepartmentValidationSchema = z.object({
  body: z.object({
    code: z.string().min(2, "Department code must be at least 2 characters").toUpperCase(),
    name: z.string().min(2, "Department name is required"),
    description: z.string().optional(),
  }),
});

const updateDepartmentValidationSchema = z.object({
  body: z.object({
    code: z.string().min(2).toUpperCase().optional(),
    name: z.string().min(2).optional(),
    description: z.string().optional(),
  }),
});

export const DepartmentValidation = {
  createDepartmentValidationSchema,
  updateDepartmentValidationSchema,
};

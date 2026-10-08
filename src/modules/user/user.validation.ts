import { z } from "zod";

const updateProfileValidationSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phoneNumber: z.string().optional(),
    avatar: z.string().url("Avatar must be a valid URL").optional(),
    address: z.string().optional(),
    dateOfBirth: z.string().datetime().optional(),
    designation: z.string().optional(),
  }),
});

const updateUserRoleStatusValidationSchema = z.object({
  body: z.object({
    role: z.enum(["ADMIN", "FACULTY", "STUDENT"]).optional(),
    status: z.enum(["ACTIVE", "BLOCKED", "SUSPENDED"]).optional(),
  }),
});

export const UserValidation = {
  updateProfileValidationSchema,
  updateUserRoleStatusValidationSchema,
};

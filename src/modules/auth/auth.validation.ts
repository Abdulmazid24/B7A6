import { z } from "zod";

const registerValidationSchema = z.object({
  body: z.object({
    email: z.string().email("Valid email address is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phoneNumber: z.string().optional(),
    departmentId: z.string().uuid("Valid department ID is required").optional(),
  }),
});

const loginValidationSchema = z.object({
  body: z.object({
    email: z.string().email("Valid email address is required"),
    password: z.string().min(1, "Password is required"),
  }),
});

const googleLoginValidationSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, "Google ID token is required"),
  }),
});

const refreshTokenValidationSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

const changePasswordValidationSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
  }),
});

export const AuthValidation = {
  registerValidationSchema,
  loginValidationSchema,
  googleLoginValidationSchema,
  refreshTokenValidationSchema,
  changePasswordValidationSchema,
};

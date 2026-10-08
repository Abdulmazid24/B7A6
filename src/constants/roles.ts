export const USER_ROLES = {
  ADMIN: "ADMIN",
  FACULTY: "FACULTY",
  STUDENT: "STUDENT",
} as const;

export type UserRoleType = (typeof USER_ROLES)[keyof typeof USER_ROLES];

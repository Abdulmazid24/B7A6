import { UserRoleType } from "../../constants/roles";

export interface IUpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;
  address?: string;
  dateOfBirth?: string;
  designation?: string;
}

export interface IUpdateUserRoleStatusPayload {
  role?: UserRoleType;
  status?: "ACTIVE" | "BLOCKED" | "SUSPENDED";
}

export interface IUserFilterParams {
  search?: string;
  role?: string;
  status?: string;
  departmentId?: string;
}

import { UserRoleType } from "../constants/roles";

export interface IAuthUser {
  id: string;
  email: string;
  role: UserRoleType;
  studentId?: string | null;
  facultyId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}

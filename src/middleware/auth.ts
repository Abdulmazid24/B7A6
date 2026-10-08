import { Request, Response, NextFunction } from "express";
import { UserRoleType } from "../constants/roles";
import { AppError } from "../utils/app-error";
import { verifyToken } from "../utils/jwt";
import { config } from "../config";
import prisma from "../lib/prisma";
import { IAuthUser } from "../types/express";

export const auth = (...requiredRoles: UserRoleType[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      let token: string | undefined;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
      }

      if (!token) {
        throw new AppError(401, "You are not authorized to access this resource");
      }

      // Verify Access Token
      const decoded = verifyToken<IAuthUser>(token, config.jwt.accessSecret);

      // Verify User in Database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { profile: true },
      });

      if (!user) {
        throw new AppError(401, "User belonging to this token no longer exists");
      }

      if (user.isDeleted) {
        throw new AppError(403, "This user account has been deactivated");
      }

      if (user.status === "BLOCKED" || user.status === "SUSPENDED") {
        throw new AppError(403, `Your account is ${user.status.toLowerCase()}`);
      }

      // Check Role Permissions
      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role as UserRoleType)) {
        throw new AppError(
          403,
          `Access forbidden: Role '${user.role}' is not permitted to perform this action`
        );
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role as UserRoleType,
        studentId: user.profile?.studentId || null,
        facultyId: user.profile?.facultyId || null,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

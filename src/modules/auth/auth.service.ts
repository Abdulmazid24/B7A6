import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import prisma from "../../lib/prisma";
import { config } from "../../config";
import { AppError } from "../../utils/app-error";
import { generateToken, verifyToken } from "../../utils/jwt";
import { AuditService } from "../audit/audit.service";
import { IAuthUser } from "../../types/express";

const googleClient = new OAuth2Client(config.google.clientId);

interface IRegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  departmentId?: string;
}

const registerUser = async (payload: IRegisterInput, ipAddress?: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError(409, "An account with this email address already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(payload.password, salt);

  // Generate unique Student ID
  const studentCount = await prisma.user.count({ where: { role: "STUDENT" } });
  const studentId = `STU-${new Date().getFullYear()}-${String(studentCount + 1).padStart(3, "0")}`;

  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: payload.email.toLowerCase(),
        password: hashedPassword,
        role: "STUDENT",
        profile: {
          create: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            phoneNumber: payload.phoneNumber || null,
            departmentId: payload.departmentId || null,
            studentId,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return user;
  });

  await AuditService.createAuditLog({
    userId: newUser.id,
    action: "USER_REGISTERED",
    resource: "User",
    details: { email: newUser.email, role: newUser.role, studentId },
    ipAddress,
  });

  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

const loginUser = async (payload: { email: string; password: string }, ipAddress?: string) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() },
    include: { profile: true },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  if (user.isDeleted) {
    throw new AppError(403, "Your account has been deactivated");
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(403, `Account access restricted: Account is ${user.status.toLowerCase()}`);
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordValid) {
    throw new AppError(401, "Invalid email or password");
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    studentId: user.profile?.studentId || null,
    facultyId: user.profile?.facultyId || null,
  };

  const accessToken = generateToken(
    tokenPayload,
    config.jwt.accessSecret,
    config.jwt.accessExpiresIn
  );

  const refreshToken = generateToken(
    tokenPayload,
    config.jwt.refreshSecret,
    config.jwt.refreshExpiresIn
  );

  await AuditService.createAuditLog({
    userId: user.id,
    action: "USER_LOGIN_SUCCESS",
    resource: "Auth",
    details: { email: user.email, role: user.role },
    ipAddress,
  });

  const { password: _, ...userWithoutPassword } = user;

  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  };
};

const googleLogin = async (idToken: string, ipAddress?: string) => {
  let googleEmail: string | undefined;
  let googleId: string | undefined;
  let firstName = "Google";
  let lastName = "User";

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google.clientId || undefined,
    });
    const payload = ticket.getPayload();
    if (payload) {
      googleEmail = payload.email?.toLowerCase();
      googleId = payload.sub;
      firstName = payload.given_name || "Google";
      lastName = payload.family_name || "User";
    }
  } catch (error) {
    // If running in development without valid client ID configured, allow structured decode fallback
    if (config.env === "development") {
      try {
        const decoded = Buffer.from(idToken.split(".")[1] || "", "base64").toString();
        const parsed = JSON.parse(decoded);
        googleEmail = parsed.email?.toLowerCase();
        googleId = parsed.sub || "dev-google-sub";
        firstName = parsed.given_name || "Dev";
        lastName = parsed.family_name || "User";
      } catch {
        throw new AppError(400, "Invalid Google ID token provided");
      }
    } else {
      throw new AppError(400, "Google authentication verification failed");
    }
  }

  if (!googleEmail) {
    throw new AppError(400, "Unable to extract email from Google token");
  }

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ email: googleEmail }, { googleId: googleId || undefined }],
    },
    include: { profile: true },
  });

  if (!user) {
    // Register as new student
    const studentCount = await prisma.user.count({ where: { role: "STUDENT" } });
    const studentId = `STU-${new Date().getFullYear()}-${String(studentCount + 1).padStart(3, "0")}`;

    const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

    user = await prisma.user.create({
      data: {
        email: googleEmail,
        password: randomPassword,
        googleId: googleId || null,
        isEmailVerified: true,
        role: "STUDENT",
        profile: {
          create: {
            firstName,
            lastName,
            studentId,
          },
        },
      },
      include: { profile: true },
    });
  } else if (!user.googleId && googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId, isEmailVerified: true },
      include: { profile: true },
    });
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    studentId: user.profile?.studentId || null,
    facultyId: user.profile?.facultyId || null,
  };

  const accessToken = generateToken(
    tokenPayload,
    config.jwt.accessSecret,
    config.jwt.accessExpiresIn
  );

  const refreshToken = generateToken(
    tokenPayload,
    config.jwt.refreshSecret,
    config.jwt.refreshExpiresIn
  );

  await AuditService.createAuditLog({
    userId: user.id,
    action: "USER_GOOGLE_LOGIN_SUCCESS",
    resource: "Auth",
    details: { email: user.email, role: user.role },
    ipAddress,
  });

  const { password: _, ...userWithoutPassword } = user;

  return {
    accessToken,
    refreshToken,
    user: userWithoutPassword,
  };
};

const refreshToken = async (token: string) => {
  const decoded = verifyToken<IAuthUser>(token, config.jwt.refreshSecret);

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    include: { profile: true },
  });

  if (!user || user.isDeleted || user.status !== "ACTIVE") {
    throw new AppError(401, "Invalid refresh token or inactive user");
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    studentId: user.profile?.studentId || null,
    facultyId: user.profile?.facultyId || null,
  };

  const accessToken = generateToken(
    tokenPayload,
    config.jwt.accessSecret,
    config.jwt.accessExpiresIn
  );

  return { accessToken };
};

const changePassword = async (
  userId: string,
  payload: { oldPassword: string; newPassword: string },
  ipAddress?: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const isOldMatch = await bcrypt.compare(payload.oldPassword, user.password);
  if (!isOldMatch) {
    throw new AppError(400, "Current password does not match");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(payload.newPassword, salt);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  await AuditService.createAuditLog({
    userId,
    action: "PASSWORD_CHANGED",
    resource: "User",
    details: "User password updated successfully",
    ipAddress,
  });

  return { message: "Password updated successfully" };
};

export const AuthService = {
  registerUser,
  loginUser,
  googleLogin,
  refreshToken,
  changePassword,
};

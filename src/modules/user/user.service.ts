import prisma from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { IPaginationOptions, calculatePagination } from "../../utils/pagination";
import { AuditService } from "../audit/audit.service";
import { AUDIT_ACTIONS, AUDIT_RESOURCES } from "../../constants/audit-events";
import { HTTP_STATUS } from "../../constants/status-codes";

const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          department: true,
        },
      },
    },
  });

  if (!user || user.isDeleted) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, "User profile not found");
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const updateMyProfile = async (userId: string, payload: any) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user || user.isDeleted) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, "User profile not found");
  }

  const updatedProfile = await prisma.profile.update({
    where: { userId },
    data: {
      firstName: payload.firstName ?? user.profile?.firstName,
      lastName: payload.lastName ?? user.profile?.lastName,
      phoneNumber: payload.phoneNumber ?? user.profile?.phoneNumber,
      avatar: payload.avatar ?? user.profile?.avatar,
      address: payload.address ?? user.profile?.address,
      dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : user.profile?.dateOfBirth,
      designation: payload.designation ?? user.profile?.designation,
    },
    include: {
      department: true,
    },
  });

  await AuditService.createAuditLog({
    userId,
    action: AUDIT_ACTIONS.PROFILE_UPDATED,
    resource: AUDIT_RESOURCES.PROFILE,
    details: "User updated their personal profile information",
  });

  return updatedProfile;
};

const getAllUsers = async (
  options: IPaginationOptions,
  filters: { search?: string; role?: string; status?: string; departmentId?: string }
) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const where: any = {
    isDeleted: false,
  };

  if (filters.role) {
    where.role = filters.role;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.OR = [
      { email: { contains: filters.search, mode: "insensitive" } },
      { profile: { firstName: { contains: filters.search, mode: "insensitive" } } },
      { profile: { lastName: { contains: filters.search, mode: "insensitive" } } },
      { profile: { studentId: { contains: filters.search, mode: "insensitive" } } },
      { profile: { facultyId: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  if (filters.departmentId) {
    where.profile = {
      ...(where.profile || {}),
      departmentId: filters.departmentId,
    };
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          include: {
            department: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data,
  };
};

const updateUserRoleStatus = async (
  adminId: string,
  targetUserId: string,
  payload: { role?: "ADMIN" | "FACULTY" | "STUDENT"; status?: "ACTIVE" | "BLOCKED" | "SUSPENDED" }
) => {
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });

  if (!targetUser || targetUser.isDeleted) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, "Target user not found");
  }

  if (targetUser.id === adminId && payload.role && payload.role !== "ADMIN") {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, "Administrators cannot demote their own admin role");
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      ...(payload.role ? { role: payload.role } : {}),
      ...(payload.status ? { status: payload.status } : {}),
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
      profile: true,
    },
  });

  await AuditService.createAuditLog({
    userId: adminId,
    action: AUDIT_ACTIONS.USER_ROLE_STATUS_UPDATED,
    resource: AUDIT_RESOURCES.USER,
    details: {
      targetUserId,
      targetEmail: targetUser.email,
      oldRole: targetUser.role,
      newRole: updatedUser.role,
      oldStatus: targetUser.status,
      newStatus: updatedUser.status,
    },
  });

  return updatedUser;
};

const softDeleteUser = async (adminId: string, targetUserId: string) => {
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });

  if (!targetUser || targetUser.isDeleted) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, "User not found or already deleted");
  }

  if (targetUser.id === adminId) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, "Administrators cannot delete their own account");
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  await AuditService.createAuditLog({
    userId: adminId,
    action: AUDIT_ACTIONS.USER_SOFT_DELETED,
    resource: AUDIT_RESOURCES.USER,
    details: { targetUserId, targetEmail: targetUser.email },
  });

  return { message: "User soft-deleted successfully" };
};

export const UserService = {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  updateUserRoleStatus,
  softDeleteUser,
};

import prisma from "../../lib/prisma";
import { IPaginationOptions, calculatePagination } from "../../utils/pagination";

export interface ICreateAuditLogInput {
  userId?: string | null;
  action: string;
  resource: string;
  details?: string | Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const createAuditLog = async (data: ICreateAuditLogInput) => {
  try {
    const detailsString =
      typeof data.details === "object" && data.details !== null
        ? JSON.stringify(data.details)
        : data.details || null;

    return await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        resource: data.resource,
        details: detailsString,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    return null;
  }
};

const getAllAuditLogs = async (
  options: IPaginationOptions,
  filters: { action?: string; resource?: string; userId?: string }
) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const where: any = {};
  if (filters.action) where.action = { contains: filters.action, mode: "insensitive" };
  if (filters.resource) where.resource = { contains: filters.resource, mode: "insensitive" };
  if (filters.userId) where.userId = filters.userId;

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
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

export const AuditService = {
  createAuditLog,
  getAllAuditLogs,
};

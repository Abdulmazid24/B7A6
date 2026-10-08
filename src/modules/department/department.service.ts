import prisma from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { IPaginationOptions } from "../../utils/pagination";
import { buildPrismaQuery } from "../../utils/query-builder";
import { AuditService } from "../audit/audit.service";
import { AUDIT_ACTIONS, AUDIT_RESOURCES } from "../../constants/audit-events";
import {
  ICreateDepartmentPayload,
  IDepartmentFilterParams,
  IUpdateDepartmentPayload,
} from "./department.interface";

const createDepartment = async (adminId: string, payload: ICreateDepartmentPayload) => {
  const existing = await prisma.academicDepartment.findUnique({
    where: { code: payload.code.toUpperCase() },
  });

  if (existing && !existing.isDeleted) {
    throw new AppError(409, `Department with code '${payload.code}' already exists`);
  }

  const department = await prisma.academicDepartment.create({
    data: {
      code: payload.code.toUpperCase(),
      name: payload.name,
      description: payload.description || null,
    },
  });

  await AuditService.createAuditLog({
    userId: adminId,
    action: AUDIT_ACTIONS.DEPARTMENT_CREATED,
    resource: AUDIT_RESOURCES.ACADEMIC_DEPARTMENT,
    details: { code: department.code, name: department.name },
  });

  return department;
};

const getAllDepartments = async (
  options: IPaginationOptions,
  filters: IDepartmentFilterParams
) => {
  const query = buildPrismaQuery(options, filters, {
    searchableFields: ["code", "name"],
  });

  const [data, total] = await Promise.all([
    prisma.academicDepartment.findMany({
      where: query.where,
      skip: query.skip,
      take: query.take,
      orderBy: query.orderBy,
      include: {
        _count: {
          select: {
            courses: true,
            profiles: true,
          },
        },
      },
    }),
    prisma.academicDepartment.count({ where: query.where }),
  ]);

  return {
    meta: query.meta(total),
    data,
  };
};

const getDepartmentById = async (id: string) => {
  const department = await prisma.academicDepartment.findUnique({
    where: { id },
    include: {
      courses: {
        where: { isDeleted: false },
        select: {
          id: true,
          code: true,
          title: true,
          credits: true,
        },
      },
      profiles: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          facultyId: true,
          studentId: true,
          designation: true,
        },
      },
    },
  });

  if (!department || department.isDeleted) {
    throw new AppError(404, "Academic Department not found");
  }

  return department;
};

const updateDepartment = async (
  adminId: string,
  id: string,
  payload: Partial<ICreateDepartmentInput>
) => {
  const department = await prisma.academicDepartment.findUnique({ where: { id } });

  if (!department || department.isDeleted) {
    throw new AppError(404, "Academic Department not found");
  }

  if (payload.code && payload.code.toUpperCase() !== department.code) {
    const duplicate = await prisma.academicDepartment.findUnique({
      where: { code: payload.code.toUpperCase() },
    });
    if (duplicate && duplicate.id !== id) {
      throw new AppError(409, `Department code '${payload.code}' is already in use`);
    }
  }

  const updated = await prisma.academicDepartment.update({
    where: { id },
    data: {
      ...(payload.code ? { code: payload.code.toUpperCase() } : {}),
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
    },
  });

  await AuditService.createAuditLog({
    userId: adminId,
    action: AUDIT_ACTIONS.DEPARTMENT_UPDATED,
    resource: AUDIT_RESOURCES.ACADEMIC_DEPARTMENT,
    details: { id, changes: payload },
  });

  return updated;
};

const softDeleteDepartment = async (adminId: string, id: string) => {
  const department = await prisma.academicDepartment.findUnique({
    where: { id },
    include: {
      _count: {
        select: { courses: true },
      },
    },
  });

  if (!department || department.isDeleted) {
    throw new AppError(404, "Academic Department not found or already deleted");
  }

  if (department._count.courses > 0) {
    throw new AppError(
      400,
      "Cannot delete department that contains active courses. Delete or reassign courses first."
    );
  }

  await prisma.academicDepartment.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  await AuditService.createAuditLog({
    userId: adminId,
    action: AUDIT_ACTIONS.DEPARTMENT_SOFT_DELETED,
    resource: AUDIT_RESOURCES.ACADEMIC_DEPARTMENT,
    details: { id, code: department.code },
  });

  return { message: "Department soft-deleted successfully" };
};

export const DepartmentService = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  softDeleteDepartment,
};

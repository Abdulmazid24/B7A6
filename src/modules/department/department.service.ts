import prisma from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { IPaginationOptions, calculatePagination } from "../../utils/pagination";
import { AuditService } from "../audit/audit.service";

interface ICreateDepartmentInput {
  code: string;
  name: string;
  description?: string;
}

const createDepartment = async (adminId: string, payload: ICreateDepartmentInput) => {
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
    action: "DEPARTMENT_CREATED",
    resource: "AcademicDepartment",
    details: { code: department.code, name: department.name },
  });

  return department;
};

const getAllDepartments = async (
  options: IPaginationOptions,
  filters: { search?: string }
) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const where: any = {
    isDeleted: false,
  };

  if (filters.search) {
    where.OR = [
      { code: { contains: filters.search, mode: "insensitive" } },
      { name: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.academicDepartment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            courses: true,
            profiles: true,
          },
        },
      },
    }),
    prisma.academicDepartment.count({ where }),
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
    action: "DEPARTMENT_UPDATED",
    resource: "AcademicDepartment",
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
    action: "DEPARTMENT_SOFT_DELETED",
    resource: "AcademicDepartment",
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

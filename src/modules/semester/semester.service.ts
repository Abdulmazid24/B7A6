import prisma from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { IPaginationOptions } from "../../utils/pagination";
import { buildPrismaQuery } from "../../utils/query-builder";
import { AuditService } from "../audit/audit.service";
import { AUDIT_ACTIONS, AUDIT_RESOURCES } from "../../constants/audit-events";
import {
  ICreateSemesterPayload,
  ISemesterFilterParams,
  IUpdateSemesterPayload,
} from "./semester.interface";

const createSemester = async (adminId: string, payload: ICreateSemesterPayload) => {
  const existing = await prisma.academicSemester.findUnique({
    where: { code: payload.code.toUpperCase() },
  });

  if (existing && !existing.isDeleted) {
    throw new AppError(409, `Semester with code '${payload.code}' already exists`);
  }

  const result = await prisma.$transaction(async (tx) => {
    if (payload.isCurrent) {
      await tx.academicSemester.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return await tx.academicSemester.create({
      data: {
        name: payload.name,
        code: payload.code.toUpperCase(),
        year: payload.year,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        isCurrent: payload.isCurrent ?? false,
        isRegistrationOpen: payload.isRegistrationOpen ?? false,
      },
    });
  });

  await AuditService.createAuditLog({
    userId: adminId,
    action: AUDIT_ACTIONS.SEMESTER_CREATED,
    resource: AUDIT_RESOURCES.ACADEMIC_SEMESTER,
    details: { code: result.code, name: result.name, year: result.year },
  });

  return result;
};

const getAllSemesters = async (
  options: IPaginationOptions,
  filters: ISemesterFilterParams
) => {
  const query = buildPrismaQuery(options, filters, {
    searchableFields: ["name", "code"],
    exactFilterFields: ["isCurrent", "year"],
  });

  const [data, total] = await Promise.all([
    prisma.academicSemester.findMany({
      where: query.where,
      skip: query.skip,
      take: query.take,
      orderBy: query.orderBy,
      include: {
        _count: {
          select: {
            offerings: true,
            tuitionFees: true,
          },
        },
      },
    }),
    prisma.academicSemester.count({ where: query.where }),
  ]);

  return {
    meta: query.meta(total),
    data,
  };
};

const getSemesterById = async (id: string) => {
  const semester = await prisma.academicSemester.findUnique({
    where: { id },
    include: {
      offerings: {
        where: { isDeleted: false },
        include: {
          course: {
            select: {
              id: true,
              code: true,
              title: true,
              credits: true,
            },
          },
          sections: {
            where: { isDeleted: false },
            include: {
              faculty: {
                select: {
                  id: true,
                  email: true,
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                      designation: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!semester || semester.isDeleted) {
    throw new AppError(404, "Academic Semester not found");
  }

  return semester;
};

const updateSemester = async (
  adminId: string,
  id: string,
  payload: Partial<ICreateSemesterInput>
) => {
  const semester = await prisma.academicSemester.findUnique({ where: { id } });

  if (!semester || semester.isDeleted) {
    throw new AppError(404, "Academic Semester not found");
  }

  const result = await prisma.$transaction(async (tx) => {
    if (payload.isCurrent) {
      await tx.academicSemester.updateMany({
        where: { id: { not: id }, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    return await tx.academicSemester.update({
      where: { id },
      data: {
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.code ? { code: payload.code.toUpperCase() } : {}),
        ...(payload.year ? { year: payload.year } : {}),
        ...(payload.startDate ? { startDate: new Date(payload.startDate) } : {}),
        ...(payload.endDate ? { endDate: new Date(payload.endDate) } : {}),
        ...(payload.isCurrent !== undefined ? { isCurrent: payload.isCurrent } : {}),
        ...(payload.isRegistrationOpen !== undefined
          ? { isRegistrationOpen: payload.isRegistrationOpen }
          : {}),
      },
    });
  });

  await AuditService.createAuditLog({
    userId: adminId,
    action: AUDIT_ACTIONS.SEMESTER_UPDATED,
    resource: AUDIT_RESOURCES.ACADEMIC_SEMESTER,
    details: { id, changes: payload },
  });

  return result;
};

const softDeleteSemester = async (adminId: string, id: string) => {
  const semester = await prisma.academicSemester.findUnique({
    where: { id },
    include: {
      _count: {
        select: { offerings: true },
      },
    },
  });

  if (!semester || semester.isDeleted) {
    throw new AppError(404, "Academic Semester not found or already deleted");
  }

  if (semester._count.offerings > 0) {
    throw new AppError(
      400,
      "Cannot delete semester with active course offerings. Remove offerings first."
    );
  }

  await prisma.academicSemester.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  await AuditService.createAuditLog({
    userId: adminId,
    action: AUDIT_ACTIONS.SEMESTER_SOFT_DELETED,
    resource: AUDIT_RESOURCES.ACADEMIC_SEMESTER,
    details: { id, code: semester.code },
  });

  return { message: "Semester soft-deleted successfully" };
};

export const SemesterService = {
  createSemester,
  getAllSemesters,
  getSemesterById,
  updateSemester,
  softDeleteSemester,
};

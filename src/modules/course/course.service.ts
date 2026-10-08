import prisma from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { IPaginationOptions } from "../../utils/pagination";
import { buildPrismaQuery } from "../../utils/query-builder";
import { AuditService } from "../audit/audit.service";
import { AUDIT_ACTIONS, AUDIT_RESOURCES } from "../../constants/audit-events";
import {
  ICreateCoursePayload,
  ICourseFilterParams,
  IUpdateCoursePayload,
} from "./course.interface";

const createCourse = async (adminId: string, payload: ICreateCoursePayload) => {
  const existing = await prisma.course.findUnique({
    where: { code: payload.code.toUpperCase() },
  });

  if (existing && !existing.isDeleted) {
    throw new AppError(409, `Course with code '${payload.code}' already exists`);
  }

  const department = await prisma.academicDepartment.findUnique({
    where: { id: payload.departmentId },
  });

  if (!department || department.isDeleted) {
    throw new AppError(404, "Referenced Academic Department not found");
  }

  const course = await prisma.$transaction(async (tx) => {
    const created = await tx.course.create({
      data: {
        code: payload.code.toUpperCase(),
        title: payload.title,
        credits: payload.credits,
        description: payload.description || null,
        departmentId: payload.departmentId,
      },
    });

    if (payload.prerequisiteIds && payload.prerequisiteIds.length > 0) {
      const prerequisiteData = payload.prerequisiteIds.map((prereqId) => ({
        courseId: created.id,
        prerequisiteId: prereqId,
      }));

      await tx.coursePrerequisite.createMany({
        data: prerequisiteData,
        skipDuplicates: true,
      });
    }

    return await tx.course.findUnique({
      where: { id: created.id },
      include: {
        department: true,
        prerequisites: {
          include: {
            prerequisite: true,
          },
        },
      },
    });
  });

  await AuditService.createAuditLog({
    userId: adminId,
    action: AUDIT_ACTIONS.COURSE_CREATED,
    resource: AUDIT_RESOURCES.COURSE,
    details: { code: course?.code, title: course?.title, credits: course?.credits },
  });

  return course;
};

const getAllCourses = async (
  options: IPaginationOptions,
  filters: ICourseFilterParams
) => {
  const query = buildPrismaQuery(options, filters, {
    searchableFields: ["code", "title"],
    exactFilterFields: ["departmentId"],
  });

  const [data, total] = await Promise.all([
    prisma.course.findMany({
      where: query.where,
      skip: query.skip,
      take: query.take,
      orderBy: query.orderBy,
      include: {
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        prerequisites: {
          include: {
            prerequisite: {
              select: {
                id: true,
                code: true,
                title: true,
                credits: true,
              },
            },
          },
        },
      },
    }),
    prisma.course.count({ where: query.where }),
  ]);

  return {
    meta: query.meta(total),
    data,
  };
};

const getCourseById = async (id: string) => {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      department: true,
      prerequisites: {
        include: {
          prerequisite: true,
        },
      },
      prerequisiteFor: {
        include: {
          course: true,
        },
      },
      offerings: {
        where: { isDeleted: false },
        include: {
          semester: true,
          sections: {
            where: { isDeleted: false },
            include: {
              faculty: {
                select: {
                  id: true,
                  profile: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!course || course.isDeleted) {
    throw new AppError(404, "Course not found");
  }

  return course;
};

const updateCourse = async (
  adminId: string,
  id: string,
  payload: Partial<ICreateCourseInput>
) => {
  const course = await prisma.course.findUnique({ where: { id } });

  if (!course || course.isDeleted) {
    throw new AppError(404, "Course not found");
  }

  const updatedCourse = await prisma.$transaction(async (tx) => {
    await tx.course.update({
      where: { id },
      data: {
        ...(payload.code ? { code: payload.code.toUpperCase() } : {}),
        ...(payload.title ? { title: payload.title } : {}),
        ...(payload.credits ? { credits: payload.credits } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.departmentId ? { departmentId: payload.departmentId } : {}),
      },
    });

    if (payload.prerequisiteIds !== undefined) {
      // Re-sync prerequisites safely
      await tx.coursePrerequisite.deleteMany({
        where: { courseId: id },
      });

      if (payload.prerequisiteIds.length > 0) {
        const prereqData = payload.prerequisiteIds.map((prereqId) => ({
          courseId: id,
          prerequisiteId: prereqId,
        }));
        await tx.coursePrerequisite.createMany({
          data: prereqData,
          skipDuplicates: true,
        });
      }
    }

    return await tx.course.findUnique({
      where: { id },
      include: {
        department: true,
        prerequisites: {
          include: {
            prerequisite: true,
          },
        },
      },
    });
  });

  await AuditService.createAuditLog({
    userId: adminId,
    action: AUDIT_ACTIONS.COURSE_UPDATED,
    resource: AUDIT_RESOURCES.COURSE,
    details: { id, changes: payload },
  });

  return updatedCourse;
};

const softDeleteCourse = async (adminId: string, id: string) => {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      _count: {
        select: { offerings: true },
      },
    },
  });

  if (!course || course.isDeleted) {
    throw new AppError(404, "Course not found or already deleted");
  }

  if (course._count.offerings > 0) {
    throw new AppError(
      400,
      "Cannot delete course with active offerings in semesters. Remove offerings first."
    );
  }

  await prisma.course.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  await AuditService.createAuditLog({
    userId: adminId,
    action: AUDIT_ACTIONS.COURSE_SOFT_DELETED,
    resource: AUDIT_RESOURCES.COURSE,
    details: { id, code: course.code },
  });

  return { message: "Course soft-deleted successfully" };
};

export const CourseService = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  softDeleteCourse,
};

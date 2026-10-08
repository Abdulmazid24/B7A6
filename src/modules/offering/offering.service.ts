import prisma from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { IPaginationOptions, calculatePagination } from "../../utils/pagination";
import { AuditService } from "../audit/audit.service";

interface ICreateOfferingInput {
  courseId: string;
  semesterId: string;
  initialSections?: Array<{
    sectionNumber: number;
    capacity: number;
    roomNumber?: string;
    schedule?: string;
    facultyId?: string;
  }>;
}

const createOffering = async (adminId: string, payload: ICreateOfferingInput) => {
  const [course, semester] = await Promise.all([
    prisma.course.findUnique({ where: { id: payload.courseId } }),
    prisma.academicSemester.findUnique({ where: { id: payload.semesterId } }),
  ]);

  if (!course || course.isDeleted) {
    throw new AppError(404, "Course not found");
  }

  if (!semester || semester.isDeleted) {
    throw new AppError(404, "Semester not found");
  }

  const existingOffering = await prisma.courseOffering.findUnique({
    where: {
      courseId_semesterId: {
        courseId: payload.courseId,
        semesterId: payload.semesterId,
      },
    },
  });

  if (existingOffering && !existingOffering.isDeleted) {
    throw new AppError(409, "Course offering already exists for this semester");
  }

  const offering = await prisma.$transaction(async (tx) => {
    const created = await tx.courseOffering.create({
      data: {
        courseId: payload.courseId,
        semesterId: payload.semesterId,
      },
    });

    if (payload.initialSections && payload.initialSections.length > 0) {
      for (const sec of payload.initialSections) {
        await tx.courseSection.create({
          data: {
            offeringId: created.id,
            sectionNumber: sec.sectionNumber,
            capacity: sec.capacity,
            roomNumber: sec.roomNumber || null,
            schedule: sec.schedule || null,
            facultyId: sec.facultyId || null,
          },
        });
      }
    } else {
      // Default Section 1
      await tx.courseSection.create({
        data: {
          offeringId: created.id,
          sectionNumber: 1,
          capacity: 30,
        },
      });
    }

    return await tx.courseOffering.findUnique({
      where: { id: created.id },
      include: {
        course: true,
        semester: true,
        sections: {
          include: {
            faculty: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
          },
        },
      },
    });
  });

  await AuditService.createAuditLog({
    userId: adminId,
    action: "COURSE_OFFERING_CREATED",
    resource: "CourseOffering",
    details: { courseCode: course.code, semesterCode: semester.code },
  });

  return offering;
};

const addSectionToOffering = async (
  adminId: string,
  offeringId: string,
  payload: {
    sectionNumber: number;
    capacity: number;
    roomNumber?: string;
    schedule?: string;
    facultyId?: string;
  }
) => {
  const offering = await prisma.courseOffering.findUnique({
    where: { id: offeringId },
    include: { course: true },
  });

  if (!offering || offering.isDeleted) {
    throw new AppError(404, "Course offering not found");
  }

  const existingSection = await prisma.courseSection.findUnique({
    where: {
      offeringId_sectionNumber: {
        offeringId,
        sectionNumber: payload.sectionNumber,
      },
    },
  });

  if (existingSection && !existingSection.isDeleted) {
    throw new AppError(409, `Section ${payload.sectionNumber} already exists for this offering`);
  }

  if (payload.facultyId) {
    const faculty = await prisma.user.findUnique({
      where: { id: payload.facultyId },
    });
    if (!faculty || faculty.role !== "FACULTY" || faculty.isDeleted) {
      throw new AppError(400, "Assigned user must be an active Faculty member");
    }
  }

  const section = await prisma.courseSection.create({
    data: {
      offeringId,
      sectionNumber: payload.sectionNumber,
      capacity: payload.capacity,
      roomNumber: payload.roomNumber || null,
      schedule: payload.schedule || null,
      facultyId: payload.facultyId || null,
    },
    include: {
      faculty: {
        select: {
          id: true,
          email: true,
          profile: true,
        },
      },
    },
  });

  await AuditService.createAuditLog({
    userId: adminId,
    action: "SECTION_CREATED",
    resource: "CourseSection",
    details: { offeringId, sectionNumber: section.sectionNumber },
  });

  return section;
};

const getAllOfferings = async (
  options: IPaginationOptions,
  filters: { semesterId?: string; courseId?: string; facultyId?: string; search?: string }
) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const where: any = {
    isDeleted: false,
  };

  if (filters.semesterId) {
    where.semesterId = filters.semesterId;
  }

  if (filters.courseId) {
    where.courseId = filters.courseId;
  }

  if (filters.facultyId) {
    where.sections = {
      some: {
        facultyId: filters.facultyId,
        isDeleted: false,
      },
    };
  }

  if (filters.search) {
    where.course = {
      OR: [
        { code: { contains: filters.search, mode: "insensitive" } },
        { title: { contains: filters.search, mode: "insensitive" } },
      ],
    };
  }

  const [data, total] = await Promise.all([
    prisma.courseOffering.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            credits: true,
            department: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
            code: true,
            isCurrent: true,
            isRegistrationOpen: true,
          },
        },
        sections: {
          where: { isDeleted: false },
          orderBy: { sectionNumber: "asc" },
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
    }),
    prisma.courseOffering.count({ where }),
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

const getOfferingById = async (id: string) => {
  const offering = await prisma.courseOffering.findUnique({
    where: { id },
    include: {
      course: {
        include: {
          department: true,
          prerequisites: {
            include: {
              prerequisite: true,
            },
          },
        },
      },
      semester: true,
      sections: {
        where: { isDeleted: false },
        orderBy: { sectionNumber: "asc" },
        include: {
          faculty: {
            select: {
              id: true,
              email: true,
              profile: true,
            },
          },
          _count: {
            select: { enrollments: true },
          },
        },
      },
    },
  });

  if (!offering || offering.isDeleted) {
    throw new AppError(404, "Course offering not found");
  }

  return offering;
};

const updateSection = async (
  adminId: string,
  sectionId: string,
  payload: {
    capacity?: number;
    roomNumber?: string;
    schedule?: string;
    facultyId?: string | null;
  }
) => {
  const section = await prisma.courseSection.findUnique({
    where: { id: sectionId },
  });

  if (!section || section.isDeleted) {
    throw new AppError(404, "Section not found");
  }

  if (payload.capacity !== undefined && payload.capacity < section.enrolledCount) {
    throw new AppError(
      400,
      `Capacity cannot be set lower than the current enrolled count (${section.enrolledCount})`
    );
  }

  if (payload.facultyId) {
    const faculty = await prisma.user.findUnique({ where: { id: payload.facultyId } });
    if (!faculty || faculty.role !== "FACULTY" || faculty.isDeleted) {
      throw new AppError(400, "Assigned user must be an active Faculty member");
    }
  }

  const updatedSection = await prisma.courseSection.update({
    where: { id: sectionId },
    data: {
      ...(payload.capacity !== undefined ? { capacity: payload.capacity } : {}),
      ...(payload.roomNumber !== undefined ? { roomNumber: payload.roomNumber } : {}),
      ...(payload.schedule !== undefined ? { schedule: payload.schedule } : {}),
      ...(payload.facultyId !== undefined ? { facultyId: payload.facultyId } : {}),
    },
    include: {
      faculty: {
        select: {
          id: true,
          email: true,
          profile: true,
        },
      },
    },
  });

  await AuditService.createAuditLog({
    userId: adminId,
    action: "SECTION_UPDATED",
    resource: "CourseSection",
    details: { sectionId, changes: payload },
  });

  return updatedSection;
};

const softDeleteOffering = async (adminId: string, id: string) => {
  const offering = await prisma.courseOffering.findUnique({
    where: { id },
    include: {
      sections: {
        include: {
          _count: { select: { enrollments: true } },
        },
      },
    },
  });

  if (!offering || offering.isDeleted) {
    throw new AppError(404, "Course offering not found or already deleted");
  }

  const hasEnrollments = offering.sections.some((s) => s._count.enrollments > 0);
  if (hasEnrollments) {
    throw new AppError(
      400,
      "Cannot delete course offering with active student enrollments. Withdraw enrollments first."
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.courseSection.updateMany({
      where: { offeringId: id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await tx.courseOffering.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  });

  await AuditService.createAuditLog({
    userId: adminId,
    action: "COURSE_OFFERING_SOFT_DELETED",
    resource: "CourseOffering",
    details: { id },
  });

  return { message: "Course offering and its sections soft-deleted successfully" };
};

export const OfferingService = {
  createOffering,
  addSectionToOffering,
  getAllOfferings,
  getOfferingById,
  updateSection,
  softDeleteOffering,
};

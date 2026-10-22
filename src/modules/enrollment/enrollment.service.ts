import prisma from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { AuditService } from "../audit/audit.service";
import { appCache } from "../../utils/cache";
import { AUDIT_ACTIONS, AUDIT_RESOURCES } from "../../constants/audit-events";
import { HTTP_STATUS } from "../../constants/status-codes";
import { Prisma } from "../../../prisma/generated/prisma/client";

const MAX_CREDITS_PER_SEMESTER = 15;
const COST_PER_CREDIT = 500.0;

const registerCourse = async (studentId: string, sectionId: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
    // 1. Fetch section and associated offering, course, and semester
    const section = await tx.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        offering: {
          include: {
            course: {
              include: {
                prerequisites: {
                  include: { prerequisite: true },
                },
              },
            },
            semester: true,
          },
        },
      },
    });

    if (!section || section.isDeleted) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, "Course section not found");
    }

    const { offering } = section;
    const { course, semester } = offering;

    if (offering.isDeleted || course.isDeleted || semester.isDeleted) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, "This course offering is no longer available");
    }

    // 2. Validate Semester Registration Window
    if (!semester.isRegistrationOpen) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        `Course registration is currently closed for semester ${semester.name}`
      );
    }

    // 3. Concurrency Check: Capacity
    if (section.enrolledCount >= section.capacity) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        `Section ${section.sectionNumber} is full. Capacity of ${section.capacity} reached.`
      );
    }

    // 4. Duplicate Registration Check
    const existingEnrollment = await tx.studentEnrollment.findUnique({
      where: { studentId_sectionId: { studentId, sectionId } },
    });

    if (existingEnrollment?.status === "ENROLLED") {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, "You are already enrolled in this section");
    }
    if (existingEnrollment?.status === "COMPLETED") {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, "You have already completed this course section");
    }

    // Check if enrolled in another section of the same course in this semester
    const enrolledInSameCourse = await tx.studentEnrollment.findFirst({
      where: {
        studentId,
        status: "ENROLLED",
        section: {
          offering: {
            courseId: course.id,
            semesterId: semester.id,
          },
        },
      },
      include: {
        section: true,
      },
    });

    if (enrolledInSameCourse) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        `You are already enrolled in Section ${enrolledInSameCourse.section.sectionNumber} of this course for this semester`
      );
    }

    // 5. Credit Limit Check
    const currentSemesterEnrollments = await tx.studentEnrollment.findMany({
      where: {
        studentId,
        status: "ENROLLED",
        section: {
          offering: {
            semesterId: semester.id,
          },
        },
      },
      include: {
        section: {
          include: {
            offering: {
              include: { course: true },
            },
          },
        },
      },
    });

    const currentTotalCredits = currentSemesterEnrollments.reduce(
      (sum, item) => sum + item.section.offering.course.credits,
      0
    );

    if (currentTotalCredits + course.credits > MAX_CREDITS_PER_SEMESTER) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        `Credit limit exceeded. Enrolling in ${course.code} (${course.credits} cr) would total ${
          currentTotalCredits + course.credits
        } credits. Max allowed is ${MAX_CREDITS_PER_SEMESTER} credits.`
      );
    }

    // 6. Prerequisite Check
    if (course.prerequisites && course.prerequisites.length > 0) {
      for (const req of course.prerequisites) {
        const completedPrereq = await tx.studentEnrollment.findFirst({
          where: {
            studentId,
            status: "COMPLETED",
            section: {
              offering: {
                courseId: req.prerequisiteId,
              },
            },
            grade: {
              letterGrade: { not: "F" },
            },
          },
        });

        if (!completedPrereq) {
          throw new AppError(
            HTTP_STATUS.BAD_REQUEST,
            `Prerequisite not fulfilled: You must complete ${req.prerequisite.code} (${req.prerequisite.title}) before registering for ${course.code}`
          );
        }
      }
    }

    // 7. Perform Enrollment & Increment Section Count
    // Atomically reserve a seat. The earlier capacity check is only a fast path;
    // this conditional update is what prevents concurrent requests overselling it.
    const seatReserved = await tx.courseSection.updateMany({
      where: { id: sectionId, isDeleted: false, enrolledCount: { lt: section.capacity } },
      data: { enrolledCount: { increment: 1 } },
    });
    if (seatReserved.count !== 1) {
      throw new AppError(HTTP_STATUS.CONFLICT, `Section ${section.sectionNumber} is full.`);
    }

    const enrollmentInclude = {
      section: {
        include: {
          offering: {
            include: {
              course: true,
              semester: true,
            },
          },
        },
      },
    } as const;
    const enrollment = existingEnrollment
      ? await tx.studentEnrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: "ENROLLED", enrolledAt: new Date() },
          include: enrollmentInclude,
        })
      : await tx.studentEnrollment.create({
          data: { studentId, sectionId, status: "ENROLLED" },
          include: enrollmentInclude,
        });

    // 8. Update or Create Tuition Fee Bill for this semester
    const tuitionAmountForCourse = course.credits * COST_PER_CREDIT;
    const existingFee = await tx.tuitionFee.findUnique({
      where: {
        studentId_semesterId: {
          studentId,
          semesterId: semester.id,
        },
      },
    });

    if (existingFee) {
      await tx.tuitionFee.update({
        where: { id: existingFee.id },
        data: {
          totalAmount: { increment: tuitionAmountForCourse },
          dueAmount: { increment: tuitionAmountForCourse },
          status: "UNPAID",
        },
      });
    } else {
      await tx.tuitionFee.create({
        data: {
          studentId,
          semesterId: semester.id,
          totalAmount: tuitionAmountForCourse,
          paidAmount: 0,
          dueAmount: tuitionAmountForCourse,
          status: "UNPAID",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days due
        },
      });
    }

    await AuditService.createAuditLog({
      userId: studentId,
      action: AUDIT_ACTIONS.COURSE_REGISTERED,
      resource: AUDIT_RESOURCES.STUDENT_ENROLLMENT,
      details: {
        sectionId,
        courseCode: course.code,
        semesterCode: semester.code,
        credits: course.credits,
      },
    }, tx);

    appCache.del("ADMIN_DASHBOARD_STATS");

    return enrollment;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      throw new AppError(HTTP_STATUS.CONFLICT, "Another registration was processed at the same time. Refresh and retry.");
    }
    throw error;
  }
};

const withdrawCourse = async (studentId: string, sectionId: string) => {
  return await prisma.$transaction(async (tx) => {
    const enrollment = await tx.studentEnrollment.findFirst({
      where: {
        studentId,
        sectionId,
        status: "ENROLLED",
      },
      include: {
        section: {
          include: {
            offering: {
              include: {
                course: true,
                semester: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, "Active course enrollment not found");
    }

    const { section } = enrollment;
    const { course, semester } = section.offering;

    // Update Enrollment Status
    const enrollmentClaim = await tx.studentEnrollment.updateMany({
      where: { id: enrollment.id, status: "ENROLLED" },
      data: { status: "WITHDRAWN" },
    });
    if (enrollmentClaim.count !== 1) {
      throw new AppError(HTTP_STATUS.CONFLICT, "This enrollment has already changed. Refresh and try again.");
    }

    const seatReleased = await tx.courseSection.updateMany({
      where: { id: sectionId, enrolledCount: { gt: 0 } },
      data: { enrolledCount: { decrement: 1 } },
    });
    if (seatReleased.count !== 1) {
      throw new AppError(HTTP_STATUS.CONFLICT, "Section seat count changed unexpectedly. Please retry.");
    }

    // Adjust tuition fee
    const refundAmount = course.credits * COST_PER_CREDIT;
    const existingFee = await tx.tuitionFee.findUnique({
      where: {
        studentId_semesterId: {
          studentId,
          semesterId: semester.id,
        },
      },
    });

    if (existingFee) {
      const newTotal = Math.max(0, existingFee.totalAmount - refundAmount);
      const newDue = Math.max(0, existingFee.dueAmount - refundAmount);
      await tx.tuitionFee.update({
        where: { id: existingFee.id },
        data: {
          totalAmount: newTotal,
          dueAmount: newDue,
          status: newDue === 0 && existingFee.paidAmount > 0 ? "PAID" : existingFee.status,
        },
      });
    }

    await AuditService.createAuditLog({
      userId: studentId,
      action: AUDIT_ACTIONS.COURSE_WITHDRAWN,
      resource: AUDIT_RESOURCES.STUDENT_ENROLLMENT,
      details: {
        sectionId,
        courseCode: course.code,
        semesterCode: semester.code,
      },
    }, tx);

    return tx.studentEnrollment.findUniqueOrThrow({ where: { id: enrollment.id } });
  });
};

const getMyEnrolledCourses = async (studentId: string, semesterId?: string) => {
  const where: any = {
    studentId,
    status: "ENROLLED",
  };

  if (semesterId) {
    where.section = {
      offering: { semesterId },
    };
  }

  const enrollments = await prisma.studentEnrollment.findMany({
    where,
    orderBy: { enrolledAt: "desc" },
    include: {
      section: {
        include: {
          offering: {
            include: {
              course: true,
              semester: true,
            },
          },
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
  });

  return enrollments;
};

const getSectionRoster = async (
  sectionId: string,
  requesterId: string,
  requesterRole: string
) => {
  const section = await prisma.courseSection.findUnique({
    where: { id: sectionId },
    include: {
      offering: {
        include: {
          course: true,
          semester: true,
        },
      },
      enrollments: {
        where: { status: "ENROLLED" },
        include: {
          student: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  studentId: true,
                  phoneNumber: true,
                },
              },
            },
          },
          grade: true,
        },
      },
    },
  });

  if (!section || section.isDeleted) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, "Section not found");
  }

  if (requesterRole === "FACULTY" && section.facultyId !== requesterId) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, "You can only view rosters for your assigned sections");
  }

  return section;
};

export const EnrollmentService = {
  registerCourse,
  withdrawCourse,
  getMyEnrolledCourses,
  getSectionRoster,
};

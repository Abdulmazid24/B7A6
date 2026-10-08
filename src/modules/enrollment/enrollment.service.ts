import prisma from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { AuditService } from "../audit/audit.service";

const MAX_CREDITS_PER_SEMESTER = 15;
const COST_PER_CREDIT = 500.0;

const registerCourse = async (studentId: string, sectionId: string) => {
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
      throw new AppError(404, "Course section not found");
    }

    const { offering } = section;
    const { course, semester } = offering;

    if (offering.isDeleted || course.isDeleted || semester.isDeleted) {
      throw new AppError(400, "This course offering is no longer available");
    }

    // 2. Validate Semester Registration Window
    if (!semester.isRegistrationOpen) {
      throw new AppError(
        400,
        `Course registration is currently closed for semester ${semester.name}`
      );
    }

    // 3. Concurrency Check: Capacity
    if (section.enrolledCount >= section.capacity) {
      throw new AppError(
        400,
        `Section ${section.sectionNumber} is full. Capacity of ${section.capacity} reached.`
      );
    }

    // 4. Duplicate Registration Check
    const existingEnrollment = await tx.studentEnrollment.findFirst({
      where: {
        studentId,
        sectionId,
        status: "ENROLLED",
      },
    });

    if (existingEnrollment) {
      throw new AppError(400, "You are already enrolled in this section");
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
        400,
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
        400,
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
            400,
            `Prerequisite not fulfilled: You must complete ${req.prerequisite.code} (${req.prerequisite.title}) before registering for ${course.code}`
          );
        }
      }
    }

    // 7. Perform Enrollment & Increment Section Count
    const enrollment = await tx.studentEnrollment.create({
      data: {
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

    await tx.courseSection.update({
      where: { id: sectionId },
      data: {
        enrolledCount: { increment: 1 },
      },
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
      action: "COURSE_REGISTERED",
      resource: "StudentEnrollment",
      details: {
        sectionId,
        courseCode: course.code,
        semesterCode: semester.code,
        credits: course.credits,
      },
    });

    return enrollment;
  });
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
      throw new AppError(404, "Active course enrollment not found");
    }

    const { section } = enrollment;
    const { course, semester } = section.offering;

    // Update Enrollment Status
    const updated = await tx.studentEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "WITHDRAWN",
      },
    });

    // Decrement section count
    await tx.courseSection.update({
      where: { id: sectionId },
      data: {
        enrolledCount: { decrement: 1 },
      },
    });

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
      action: "COURSE_WITHDRAWN",
      resource: "StudentEnrollment",
      details: {
        sectionId,
        courseCode: course.code,
        semesterCode: semester.code,
      },
    });

    return updated;
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

const getSectionRoster = async (sectionId: string) => {
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
    throw new AppError(404, "Section not found");
  }

  return section;
};

export const EnrollmentService = {
  registerCourse,
  withdrawCourse,
  getMyEnrolledCourses,
  getSectionRoster,
};

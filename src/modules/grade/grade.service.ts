import prisma from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { AuditService } from "../audit/audit.service";
import { IAuthUser } from "../../types/express";

export const computeGrade = (totalMarks: number): { letterGrade: string; gradePoint: number } => {
  if (totalMarks >= 80) return { letterGrade: "A+", gradePoint: 4.0 };
  if (totalMarks >= 75) return { letterGrade: "A", gradePoint: 3.75 };
  if (totalMarks >= 70) return { letterGrade: "A-", gradePoint: 3.5 };
  if (totalMarks >= 65) return { letterGrade: "B+", gradePoint: 3.25 };
  if (totalMarks >= 60) return { letterGrade: "B", gradePoint: 3.0 };
  if (totalMarks >= 55) return { letterGrade: "B-", gradePoint: 2.75 };
  if (totalMarks >= 50) return { letterGrade: "C+", gradePoint: 2.5 };
  if (totalMarks >= 45) return { letterGrade: "C", gradePoint: 2.25 };
  if (totalMarks >= 40) return { letterGrade: "D", gradePoint: 2.0 };
  return { letterGrade: "F", gradePoint: 0.0 };
};

interface ISubmitGradeInput {
  enrollmentId: string;
  midtermMarks?: number;
  finalMarks?: number;
  assessmentMarks?: number;
  isPublished?: boolean;
}

const submitGrade = async (user: IAuthUser, payload: ISubmitGradeInput) => {
  const enrollment = await prisma.studentEnrollment.findUnique({
    where: { id: payload.enrollmentId },
    include: {
      section: {
        include: {
          offering: {
            include: { course: true, semester: true },
          },
        },
      },
      student: { select: { email: true } },
    },
  });

  if (!enrollment) {
    throw new AppError(404, "Student enrollment not found");
  }

  // Permission Check: Faculty can only grade sections they teach
  if (user.role === "FACULTY" && enrollment.section.facultyId !== user.id) {
    throw new AppError(403, "You can only submit grades for your assigned course sections");
  }

  const existingGrade = await prisma.studentGrade.findUnique({
    where: { enrollmentId: payload.enrollmentId },
  });

  const midterm = payload.midtermMarks ?? existingGrade?.midtermMarks ?? 0;
  const final = payload.finalMarks ?? existingGrade?.finalMarks ?? 0;
  const assessment = payload.assessmentMarks ?? existingGrade?.assessmentMarks ?? 0;

  const totalMarks = Math.min(100, Math.round((midterm + final + assessment) * 100) / 100);
  const { letterGrade, gradePoint } = computeGrade(totalMarks);
  const isPublished = payload.isPublished ?? existingGrade?.isPublished ?? false;

  const result = await prisma.$transaction(async (tx) => {
    const grade = await tx.studentGrade.upsert({
      where: { enrollmentId: payload.enrollmentId },
      create: {
        enrollmentId: payload.enrollmentId,
        studentId: enrollment.studentId,
        sectionId: enrollment.sectionId,
        facultyId: user.id,
        midtermMarks: midterm,
        finalMarks: final,
        assessmentMarks: assessment,
        totalMarks,
        letterGrade,
        gradePoint,
        isPublished,
      },
      update: {
        midtermMarks: midterm,
        finalMarks: final,
        assessmentMarks: assessment,
        totalMarks,
        letterGrade,
        gradePoint,
        isPublished,
        facultyId: user.id,
      },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { firstName: true, lastName: true, studentId: true },
            },
          },
        },
      },
    });

    if (isPublished) {
      if (gradePoint > 0) {
        await tx.studentEnrollment.update({
          where: { id: payload.enrollmentId },
          data: { status: "COMPLETED" },
        });
      }
    }

    return grade;
  });

  await AuditService.createAuditLog({
    userId: user.id,
    action: "GRADE_SUBMITTED",
    resource: "StudentGrade",
    details: {
      enrollmentId: payload.enrollmentId,
      studentEmail: enrollment.student.email,
      courseCode: enrollment.section.offering.course.code,
      totalMarks,
      letterGrade,
      gradePoint,
      isPublished,
    },
  });

  return result;
};

const getSectionGrades = async (user: IAuthUser, sectionId: string) => {
  const section = await prisma.courseSection.findUnique({
    where: { id: sectionId },
    include: {
      offering: {
        include: { course: true, semester: true },
      },
    },
  });

  if (!section) {
    throw new AppError(404, "Course section not found");
  }

  if (user.role === "FACULTY" && section.facultyId !== user.id) {
    throw new AppError(403, "You can only view grades for your assigned course sections");
  }

  const grades = await prisma.studentGrade.findMany({
    where: { sectionId },
    include: {
      student: {
        select: {
          id: true,
          email: true,
          profile: {
            select: { firstName: true, lastName: true, studentId: true },
          },
        },
      },
    },
  });

  return {
    section: {
      id: section.id,
      sectionNumber: section.sectionNumber,
      course: section.offering.course,
      semester: section.offering.semester,
    },
    grades,
  };
};

const getMyTranscript = async (studentId: string) => {
  const enrollments = await prisma.studentEnrollment.findMany({
    where: {
      studentId,
      grade: { isPublished: true },
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
      grade: true,
    },
  });

  // Group by Semester
  const semesterMap = new Map<string, any>();
  let totalCreditsAttempted = 0;
  let totalCreditsEarned = 0;
  let totalGradePointsWeighted = 0;

  for (const enr of enrollments) {
    const { section, grade } = enr;
    const { course, semester } = section.offering;

    if (!grade) continue;

    if (!semesterMap.has(semester.id)) {
      semesterMap.set(semester.id, {
        semester: {
          id: semester.id,
          name: semester.name,
          code: semester.code,
          year: semester.year,
        },
        courses: [],
        semesterCredits: 0,
        semesterGradePointsWeighted: 0,
        semesterGpa: 0,
      });
    }

    const semData = semesterMap.get(semester.id);

    semData.courses.push({
      courseCode: course.code,
      courseTitle: course.title,
      credits: course.credits,
      midtermMarks: grade.midtermMarks,
      finalMarks: grade.finalMarks,
      assessmentMarks: grade.assessmentMarks,
      totalMarks: grade.totalMarks,
      letterGrade: grade.letterGrade,
      gradePoint: grade.gradePoint,
    });

    semData.semesterCredits += course.credits;
    semData.semesterGradePointsWeighted += (grade.gradePoint ?? 0) * course.credits;

    totalCreditsAttempted += course.credits;
    if ((grade.gradePoint ?? 0) > 0) {
      totalCreditsEarned += course.credits;
    }
    totalGradePointsWeighted += (grade.gradePoint ?? 0) * course.credits;
  }

  const semesters = Array.from(semesterMap.values()).map((sem) => {
    const gpa =
      sem.semesterCredits > 0
        ? Math.round((sem.semesterGradePointsWeighted / sem.semesterCredits) * 100) / 100
        : 0.0;
    return {
      ...sem,
      semesterGpa: gpa,
    };
  });

  const cgpa =
    totalCreditsAttempted > 0
      ? Math.round((totalGradePointsWeighted / totalCreditsAttempted) * 100) / 100
      : 0.0;

  return {
    studentId,
    totalCreditsAttempted,
    totalCreditsEarned,
    cgpa,
    semesters,
  };
};

export const GradeService = {
  submitGrade,
  getSectionGrades,
  getMyTranscript,
};

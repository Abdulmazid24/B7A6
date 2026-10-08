import prisma from "../../lib/prisma";

const getDashboardStats = async () => {
  const [
    totalStudents,
    totalFaculty,
    totalAdmins,
    totalDepartments,
    totalCourses,
    activeSemester,
    totalEnrollments,
    totalPaymentsAgg,
    recentEnrollments,
    recentPayments,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT", isDeleted: false } }),
    prisma.user.count({ where: { role: "FACULTY", isDeleted: false } }),
    prisma.user.count({ where: { role: "ADMIN", isDeleted: false } }),
    prisma.academicDepartment.count({ where: { isDeleted: false } }),
    prisma.course.count({ where: { isDeleted: false } }),
    prisma.academicSemester.findFirst({ where: { isCurrent: true, isDeleted: false } }),
    prisma.studentEnrollment.count(),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED" },
    }),
    prisma.studentEnrollment.findMany({
      take: 5,
      orderBy: { enrolledAt: "desc" },
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
        section: {
          include: {
            offering: {
              include: { course: true },
            },
          },
        },
      },
    }),
    prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      where: { status: "COMPLETED" },
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
    }),
  ]);

  const totalRevenue = totalPaymentsAgg._sum.amount || 0;

  // Aggregate pending / due tuition fees
  const dueFeesAgg = await prisma.tuitionFee.aggregate({
    _sum: { dueAmount: true },
    where: { isDeleted: false },
  });

  const totalOutstandingDue = dueFeesAgg._sum.dueAmount || 0;

  return {
    overview: {
      totalStudents,
      totalFaculty,
      totalAdmins,
      totalDepartments,
      totalCourses,
      totalEnrollments,
      totalRevenueCollected: totalRevenue,
      totalOutstandingDue,
    },
    activeSemester: activeSemester
      ? {
          id: activeSemester.id,
          name: activeSemester.name,
          code: activeSemester.code,
          year: activeSemester.year,
          isRegistrationOpen: activeSemester.isRegistrationOpen,
        }
      : null,
    recentActivity: {
      recentEnrollments,
      recentPayments,
    },
  };
};

export const AdminDashboardService = {
  getDashboardStats,
};

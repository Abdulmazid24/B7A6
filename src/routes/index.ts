import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { UserRoutes } from "../modules/user/user.routes";
import { DepartmentRoutes } from "../modules/department/department.routes";
import { SemesterRoutes } from "../modules/semester/semester.routes";
import { CourseRoutes } from "../modules/course/course.routes";
import { OfferingRoutes } from "../modules/offering/offering.routes";
import { EnrollmentRoutes } from "../modules/enrollment/enrollment.routes";
import { GradeRoutes } from "../modules/grade/grade.routes";
import { PaymentRoutes } from "../modules/payment/payment.routes";
import { AdminRoutes } from "../modules/admin/admin.routes";
import { AuditRoutes } from "../modules/audit/audit.routes";

const router = Router();

import prisma from "../lib/prisma";
import { config } from "../config";
import { RESPONSE_MESSAGES } from "../constants/response-messages";
import { HTTP_STATUS } from "../constants/status-codes";

// System Diagnostics & Health Check
router.get("/health", async (_req, res) => {
  let dbStatus = "CONNECTED";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "DISCONNECTED";
  }

  const memory = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: RESPONSE_MESSAGES.HEALTH_CHECK_SUCCESS,
    environment: config.env,
    database: dbStatus,
    uptime: `${uptimeSeconds}s`,
    memory: {
      rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
    },
    timestamp: new Date().toISOString(),
  });
});

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/users", route: UserRoutes },
  { path: "/departments", route: DepartmentRoutes },
  { path: "/semesters", route: SemesterRoutes },
  { path: "/courses", route: CourseRoutes },
  { path: "/course-offerings", route: OfferingRoutes },
  { path: "/enrollments", route: EnrollmentRoutes },
  { path: "/grades", route: GradeRoutes },
  { path: "/payments", route: PaymentRoutes },
  { path: "/admin", route: AdminRoutes },
  { path: "/audit-logs", route: AuditRoutes },
];

moduleRoutes.forEach((item) => {
  router.use(item.path, item.route);
});

export default router;

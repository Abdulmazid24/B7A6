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

// Health Check
router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "University Management System API is healthy and operational",
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

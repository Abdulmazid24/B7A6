import { Router } from "express";
import { EnrollmentController } from "./enrollment.controller";
import { auth } from "../../middleware/auth";
import { USER_ROLES } from "../../constants/roles";
import { validateRequest } from "../../middleware/validate-request";
import { EnrollmentValidation } from "./enrollment.validation";

const router = Router();

// Student-only endpoints
router.post(
  "/register",
  auth(USER_ROLES.STUDENT),
  validateRequest(EnrollmentValidation.registerCourseValidationSchema),
  EnrollmentController.registerCourse
);

router.post(
  "/withdraw",
  auth(USER_ROLES.STUDENT),
  validateRequest(EnrollmentValidation.withdrawCourseValidationSchema),
  EnrollmentController.withdrawCourse
);

router.get(
  "/my-courses",
  auth(USER_ROLES.STUDENT),
  EnrollmentController.getMyEnrolledCourses
);

// Faculty & Admin can view student roster for a section
router.get(
  "/section/:sectionId",
  auth(USER_ROLES.FACULTY, USER_ROLES.ADMIN),
  EnrollmentController.getSectionRoster
);

export const EnrollmentRoutes = router;

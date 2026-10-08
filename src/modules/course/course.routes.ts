import { Router } from "express";
import { CourseController } from "./course.controller";
import { auth } from "../../middleware/auth";
import { USER_ROLES } from "../../constants/roles";
import { validateRequest } from "../../middleware/validate-request";
import { CourseValidation } from "./course.validation";

const router = Router();

// Read courses (Authenticated)
router.get("/", auth(), CourseController.getAllCourses);
router.get("/:id", auth(), CourseController.getCourseById);

// Admin-only course operations
router.post(
  "/",
  auth(USER_ROLES.ADMIN),
  validateRequest(CourseValidation.createCourseValidationSchema),
  CourseController.createCourse
);

router.patch(
  "/:id",
  auth(USER_ROLES.ADMIN),
  validateRequest(CourseValidation.updateCourseValidationSchema),
  CourseController.updateCourse
);

router.delete("/:id", auth(USER_ROLES.ADMIN), CourseController.softDeleteCourse);

export const CourseRoutes = router;

import { Router } from "express";
import { SemesterController } from "./semester.controller";
import { auth } from "../../middleware/auth";
import { USER_ROLES } from "../../constants/roles";
import { validateRequest } from "../../middleware/validate-request";
import { SemesterValidation } from "./semester.validation";

const router = Router();

// Read operations (Authenticated)
router.get("/", auth(), SemesterController.getAllSemesters);
router.get("/:id", auth(), SemesterController.getSemesterById);

// Admin-only operations
router.post(
  "/",
  auth(USER_ROLES.ADMIN),
  validateRequest(SemesterValidation.createSemesterValidationSchema),
  SemesterController.createSemester
);

router.patch(
  "/:id",
  auth(USER_ROLES.ADMIN),
  validateRequest(SemesterValidation.updateSemesterValidationSchema),
  SemesterController.updateSemester
);

router.delete("/:id", auth(USER_ROLES.ADMIN), SemesterController.softDeleteSemester);

export const SemesterRoutes = router;

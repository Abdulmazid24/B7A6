import { Router } from "express";
import { GradeController } from "./grade.controller";
import { auth } from "../../middleware/auth";
import { USER_ROLES } from "../../constants/roles";
import { validateRequest } from "../../middleware/validate-request";
import { GradeValidation } from "./grade.validation";

const router = Router();

// Student can view their own transcript
router.get("/my-transcript", auth(USER_ROLES.STUDENT), GradeController.getMyTranscript);

// Faculty & Admin can view grades of a section
router.get(
  "/section/:sectionId",
  auth(USER_ROLES.FACULTY, USER_ROLES.ADMIN),
  GradeController.getSectionGrades
);

// Faculty & Admin can submit/update marks
router.post(
  "/submit",
  auth(USER_ROLES.FACULTY, USER_ROLES.ADMIN),
  validateRequest(GradeValidation.submitGradeValidationSchema),
  GradeController.submitGrade
);

export const GradeRoutes = router;

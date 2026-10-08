import { Router } from "express";
import { DepartmentController } from "./department.controller";
import { auth } from "../../middleware/auth";
import { USER_ROLES } from "../../constants/roles";
import { validateRequest } from "../../middleware/validate-request";
import { DepartmentValidation } from "./department.validation";

const router = Router();

// Public/Authenticated can read
router.get("/", auth(), DepartmentController.getAllDepartments);
router.get("/:id", auth(), DepartmentController.getDepartmentById);

// Admin-only mutations
router.post(
  "/",
  auth(USER_ROLES.ADMIN),
  validateRequest(DepartmentValidation.createDepartmentValidationSchema),
  DepartmentController.createDepartment
);

router.patch(
  "/:id",
  auth(USER_ROLES.ADMIN),
  validateRequest(DepartmentValidation.updateDepartmentValidationSchema),
  DepartmentController.updateDepartment
);

router.delete("/:id", auth(USER_ROLES.ADMIN), DepartmentController.softDeleteDepartment);

export const DepartmentRoutes = router;

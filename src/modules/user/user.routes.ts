import { Router } from "express";
import { UserController } from "./user.controller";
import { auth } from "../../middleware/auth";
import { USER_ROLES } from "../../constants/roles";
import { validateRequest } from "../../middleware/validate-request";
import { UserValidation } from "./user.validation";

const router = Router();

// Profile operations (Authenticated)
router.get("/me", auth(), UserController.getMyProfile);
router.patch(
  "/me",
  auth(),
  validateRequest(UserValidation.updateProfileValidationSchema),
  UserController.updateMyProfile
);

// Admin-only operations
router.get("/", auth(USER_ROLES.ADMIN), UserController.getAllUsers);
router.patch(
  "/:id/role-status",
  auth(USER_ROLES.ADMIN),
  validateRequest(UserValidation.updateUserRoleStatusValidationSchema),
  UserController.updateUserRoleStatus
);
router.delete("/:id", auth(USER_ROLES.ADMIN), UserController.softDeleteUser);

export const UserRoutes = router;

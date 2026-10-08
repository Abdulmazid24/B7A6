import { Router } from "express";
import { AdminDashboardController } from "./admin.controller";
import { auth } from "../../middleware/auth";
import { USER_ROLES } from "../../constants/roles";

const router = Router();

router.get(
  "/dashboard-stats",
  auth(USER_ROLES.ADMIN),
  AdminDashboardController.getDashboardStats
);

export const AdminRoutes = router;

import { Router } from "express";
import { auth } from "../../middleware/auth";
import { USER_ROLES } from "../../constants/roles";
import { AuditController } from "./audit.controller";

const router = Router();

router.get("/", auth(USER_ROLES.ADMIN), AuditController.getAllAuditLogs);

export const AuditRoutes = router;

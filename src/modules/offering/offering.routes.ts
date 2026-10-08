import { Router } from "express";
import { OfferingController } from "./offering.controller";
import { auth } from "../../middleware/auth";
import { USER_ROLES } from "../../constants/roles";
import { validateRequest } from "../../middleware/validate-request";
import { OfferingValidation } from "./offering.validation";

const router = Router();

// Read operations (Authenticated)
router.get("/", auth(), OfferingController.getAllOfferings);
router.get("/:id", auth(), OfferingController.getOfferingById);

// Admin-only operations
router.post(
  "/",
  auth(USER_ROLES.ADMIN),
  validateRequest(OfferingValidation.createOfferingValidationSchema),
  OfferingController.createOffering
);

router.post(
  "/:id/sections",
  auth(USER_ROLES.ADMIN),
  validateRequest(OfferingValidation.createSectionValidationSchema),
  OfferingController.addSection
);

router.patch(
  "/sections/:sectionId",
  auth(USER_ROLES.ADMIN),
  validateRequest(OfferingValidation.updateSectionValidationSchema),
  OfferingController.updateSection
);

router.delete("/:id", auth(USER_ROLES.ADMIN), OfferingController.softDeleteOffering);

export const OfferingRoutes = router;

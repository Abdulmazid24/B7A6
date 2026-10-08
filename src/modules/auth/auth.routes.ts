import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middleware/validate-request";
import { AuthValidation } from "./auth.validation";
import { auth } from "../../middleware/auth";

const router = Router();

router.post(
  "/register",
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.register
);

router.post(
  "/login",
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.login
);

router.post(
  "/google-login",
  validateRequest(AuthValidation.googleLoginValidationSchema),
  AuthController.googleLogin
);

router.post(
  "/refresh-token",
  validateRequest(AuthValidation.refreshTokenValidationSchema),
  AuthController.refreshToken
);

router.post(
  "/change-password",
  auth(),
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthController.changePassword
);

router.post("/logout", AuthController.logout);

export const AuthRoutes = router;

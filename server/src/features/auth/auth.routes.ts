import { Router } from "express";
import { validateRequest } from "../../middlewares";
import * as controllers from "./controllers";
import { attachUserDataService } from "./middlewares";
import { registerSchema } from "./schemas/register.schema";

export const authRoutes = Router();

authRoutes.use(attachUserDataService);

authRoutes.post(
  "/register",
  validateRequest(registerSchema),
  controllers.handleRegister
);

authRoutes.post("/sign-in", controllers.handleSignIn);

authRoutes.post("/sign-out", controllers.handleSignOut);

authRoutes.post("/refresh", controllers.handleRefresh);

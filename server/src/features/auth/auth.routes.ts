import { Router } from "express";
import { validateRequest } from "../../middlewares";
import * as controllers from "./controllers";
import { attachUserDataService } from "./middlewares";
import { registerSchema } from "./schemas/register.schema";

export const AuthRoutes = Router();

AuthRoutes.use(attachUserDataService);

AuthRoutes.post(
  "/register",
  validateRequest(registerSchema),
  controllers.handleRegister
);

AuthRoutes.post("/sign-in", controllers.handleSignIn);

AuthRoutes.post("/sign-out", controllers.handleSignOut);

AuthRoutes.post("/refresh", controllers.handleRefresh);

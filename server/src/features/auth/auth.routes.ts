import { Router } from "express";
import * as controllers from "./controllers";
import { attachUserDataService } from "./middlewares";

export const authRoutes = Router();

authRoutes.use(attachUserDataService);

authRoutes.post("/register", controllers.handleRegister);

authRoutes.post("/sign-in", controllers.handleSignIn);

authRoutes.post("/sign-out", controllers.handleSignOut);

authRoutes.post("/refresh", controllers.handleRefresh);

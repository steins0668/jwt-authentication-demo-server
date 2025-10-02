import { AuthConfig } from "../error";

export function getTknSecrets(): {
  accessSecret: string;
  refreshSecret: string;
} {
  const accessSecret: string | undefined = process.env.ACCESS_TOKEN_SECRET;
  const refreshSecret: string | undefined = process.env.REFRESH_TOKEN_SECRET;
  if (!accessSecret)
    throw new AuthConfig.ErrorClass({
      name: "AUTH_CONFIG_ENV_TKN_SECRET_ERROR",
      message: "ACCESS_TOKEN_SECRET not configured.",
    });
  if (!refreshSecret)
    throw new AuthConfig.ErrorClass({
      name: "AUTH_CONFIG_ENV_TKN_SECRET_ERROR",
      message: "REFRESH_TOKEN_SECRET not configured.",
    });

  return { accessSecret, refreshSecret };
}

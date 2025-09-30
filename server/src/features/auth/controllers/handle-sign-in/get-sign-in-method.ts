import { REGEX } from "../../../../data";

export function getSignInMethod(
  identifier: string
): "email" | "username" | null {
  const isEmail = REGEX.AUTH.EMAIL.test(identifier);
  const isUsername = REGEX.AUTH.USERNAME.test(identifier);

  if (isEmail) return "email";
  else if (isUsername) return "username";
  else return null;
}

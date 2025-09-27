import z from "zod";
import { REGEX } from "../../../data";

const { USERNAME, PASSWORD } = REGEX.AUTH;

export type RegisterSchema = z.infer<typeof registerSchema>;

export const registerSchema = z.object({
  email: z.email({
    error: (iss) =>
      iss.input === undefined ? "Email is required." : "Invalid email.",
  }),

  username: z
    .string({
      error: (iss) =>
        iss.input === undefined ? "Username is required." : "Invalid username.",
    })
    .regex(USERNAME, { error: "Invalid username." }),

  passwordHash: z
    .string({
      error: (iss) =>
        iss.input === undefined ? "Password is required." : "Invalid Password",
    })
    .regex(PASSWORD, {
      error: "Invalid password.",
    }),

  roleId: z.number(),
});

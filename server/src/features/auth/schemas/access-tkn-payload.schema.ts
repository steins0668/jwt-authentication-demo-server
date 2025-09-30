import z from "zod";

export type AccessTknPayload = z.infer<typeof accessTknPayload>;

export const accessTknPayload = z.object({
  userInfo: z.object({
    email: z.string(),
    username: z.string(),
    role: z.string(),
  }),
});

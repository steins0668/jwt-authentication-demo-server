import z from "zod";

export type RefreshTknPayload = z.infer<typeof refreshTknPayload>;

export const refreshTknPayload = z.object({
  userId: z.number(),
  sessionNumber: z.string(),
  isPersistentAuth: z.boolean().optional(),
});

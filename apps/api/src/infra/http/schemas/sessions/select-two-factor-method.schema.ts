import { z } from "zod";

export const selectTwoFactorMethodSchema = z.object({
  twoFactorId: z.string().min(1),
});

export type SelectTwoFactorMethodBody = z.infer<
  typeof selectTwoFactorMethodSchema
>;

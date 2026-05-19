import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Enter a valid email address" })
    .max(255),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(128),
  remember: z.boolean().optional(),
});

export type SignInValues = z.infer<typeof signInSchema>;
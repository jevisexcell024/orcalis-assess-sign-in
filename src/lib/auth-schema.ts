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

export const signUpSchema = z
  .object({
    institutionName: z
      .string()
      .trim()
      .min(2, { message: "Institution name is required" })
      .max(120),
    contactName: z
      .string()
      .trim()
      .min(2, { message: "Contact name is required" })
      .max(120),
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
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms to continue" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match",
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Enter a valid email address" })
    .max(255),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match",
  });

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
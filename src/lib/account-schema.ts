import { z } from "zod";

// Long over complex: length is what actually resists guessing, and character
// rules mostly produce "Password1!" and a sticky note.
const password = z
  .string()
  .min(10, "use at least 10 characters")
  .max(200)
  // A 200-character cap is not enough on its own: scrypt cost is paid per
  // attempt, so the bound is what keeps a login cheap to serve.
  .refine((value) => value.trim().length >= 10, "use at least 10 characters");

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "tell us your name").max(80),
    email: z.email("enter a valid email").max(200).toLowerCase(),
    password,
    phone: z
      .union([
        z
          .string()
          .trim()
          .regex(/^[+0-9][0-9 ()-]{5,19}$/, "enter a reachable phone number"),
        z.literal(""),
      ])
      .optional(),
    region: z.string().trim().max(80).optional(),
  })
  .refine((value) => !value.password.toLowerCase().includes(value.email.split("@")[0]!), {
    path: ["password"],
    message: "do not use your email address as the password",
  });

export const signInSchema = z.object({
  email: z.email("enter a valid email").max(200).toLowerCase(),
  password: z.string().min(1, "enter your password").max(200),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "tell us your name").max(80),
  phone: z
    .union([
      z
        .string()
        .trim()
        .regex(/^[+0-9][0-9 ()-]{5,19}$/, "enter a reachable phone number"),
      z.literal(""),
    ])
    .optional(),
  region: z.string().trim().max(80).optional(),
  locale: z.enum(["ta", "en"]),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "enter your current password").max(200),
  newPassword: password,
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;

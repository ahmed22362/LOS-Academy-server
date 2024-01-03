import { z } from "zod";

const payload = {
  body: z
    .object({
      name: z.string({
        required_error: "name is required",
      }),
      nationalId: z
        .string({
          required_error: "nationalId is required",
        })
        .refine((data) => data.length === 14, {
          message: "National id must be exactly 14 characters long.",
        }),
      phone: z.string({ required_error: "phone is required" }),
      sessionCost: z.number({
        required_error:
          "the teacher session cost is required to create a teacher!",
      }),
      role: z.enum(["admin", "teacher"]),
      password: z
        .string({
          required_error: "Password is required",
        })
        .min(6, "Password too short - should be 6 chars minimum"),
      passwordConfirmation: z.string({
        required_error: "passwordConfirmation is required",
      }),
      email: z
        .string({
          required_error: "Email is required",
        })
        .email("Not a valid email"),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      message: "Passwords do not match",
      path: ["passwordConfirmation"],
    }),
};
export const updateMeSchema = z.object({
  body: z.object({
    name: z.optional(z.string()),
    phone: z.optional(z.string()),
    email: z.optional(z.string().email("Not a valid mail")),
    gender: z.optional(z.enum(["male", "female"])),
    age: z.optional(z.number()),
    password: z.optional(
      z.string().min(6, "Password too short - should be 6 chars minimum"),
    ),
  }),
});
export const createTeacherSchema = z.object({ ...payload });
export const loginTeacherSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required for log in!" })
      .email("Not a valid mail!"),
    password: z
      .string({ required_error: "password is required" })
      .min(6, "Password too short - it was 6 chars minimum"),
  }),
});
export const isTeacherIdExist = z.object({
  body: z.object({
    teacherId: z.string({
      required_error: "TeacherId is required for this task",
    }),
  }),
});

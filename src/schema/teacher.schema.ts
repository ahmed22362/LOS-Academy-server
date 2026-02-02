import { z } from "zod";

const payload = {
  body: z
    .object({
      name: z.string({
        message: "name is required",
      }),
      nationalId: z
        .string({ message: "nationalId is required" })
        .min(1, { message: "nationalId is required" })
        .refine((data) => data.length === 14, {
          message: "National id must be exactly 14 characters long.",
        }),
      phone: z.string({ message: "phone is required" }).min(1, { message: "phone is required" }),
      hour_cost: z.number({
        message:
          "the teacher session cost is required to create a teacher!",
      }),
      role: z.enum(["admin", "teacher"]),
      password: z
        .string({
          message: "Password is required",
        })
        .min(6, "Password too short - should be 6 chars minimum"),
      passwordConfirmation: z.string({
        message: "passwordConfirmation is required",
      }),
      email: z
        .string({
          message: "Email is required",
        })
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
      .string({ message: "Email is required for log in!" })
      .min(1, { message: "Email is required for log in!" })
      .email("Not a valid mail!"),
    password: z
      .string({ message: "password is required" })
      .min(6, "Password too short - it was 6 chars minimum"),
  }),
});
export const isTeacherIdExist = z.object({
  body: z.object({
    teacherId: z.string({
      message: "TeacherId is required for this task",
    }).min(1, { message: "TeacherId is required for this task" }),
  }),
});

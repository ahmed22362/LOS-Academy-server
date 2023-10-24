import { z } from "zod"

const payload = {
  body: z
    .object({
      name: z.string({
        required_error: "name is required",
      }),
      age: z.number({
        required_error: "age is required",
      }),
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
}

export const signupUserSchema = z.object({ ...payload })

export const loginUserSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required for log in!" })
      .email("Not a valid mail!"),
    password: z
      .string({ required_error: "password is required" })
      .min(6, "Password too short - it was 6 chars minimum"),
  }),
})

export const forgetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required for log in!" })
      .email("Not a valid mail!"),
  }),
})
export const resetPasswordSchema = z.object({
  body: z
    .object({
      password: z
        .string({ required_error: "password is required" })
        .min(6, "Password too short - it was 6 chars minimum"),
      passwordConfirmation: z.string({
        required_error: "passwordConfirmation is required",
      }),
      token: z.string({ required_error: "token is Required!" }),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      message: "Passwords do not match",
      path: ["passwordConfirmation"],
    }),
})

export const updateMyPasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string({ required_error: "password is required" })
        .min(6, "Password too short - it was 6 chars minimum"),
      newPassword: z
        .string({ required_error: "new Password is required" })
        .min(6, "Password too short - it was 6 chars minimum"),
      newPasswordConfirm: z.string({
        required_error: "confirm new password is required",
      }),
    })
    .refine((data) => data.newPassword === data.newPasswordConfirm, {
      message: "Passwords do not match",
      path: ["passwordConfirmation"],
    }),
})

export const updateMeSchema = z.object({
  body: z.object({
    name: z.optional(z.string()),
    phone: z.optional(z.string()),
    email: z.optional(z.string().email("Not a valid mail")),
  }),
})
const params = {
  params: z.object({
    id: z.string({
      required_error: "Add ID to params to get the associated user!",
    }),
  }),
}
export const getMeSchema = z.object({ ...params })
export const getUserSchema = z.object({ ...params })
export const updateUserSchema = z.object({ ...params })
export const deleteUserSchema = z.object({ ...params })
export const createUserSchema = z.object({ ...payload })
type LoginUserSchemaInput = z.TypeOf<typeof loginUserSchema>
export type LoginUserSchemaBody = LoginUserSchemaInput["body"]

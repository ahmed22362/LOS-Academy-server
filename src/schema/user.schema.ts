import { z } from "zod"

const payload = {
  //body = { name, age, email, password, phone, gender }
  body: z
    .object({
      name: z.string({
        message: "name is required",
      }),
      phone: z.string({
        message: "phone is required",
      }),
      age: z.number({
        message: "age is required",
      }),
      gender: z.enum(["male", "female"]),
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
      .string({ message: "Email is required for log in!" })
      .email("Not a valid mail!"),
    password: z
      .string({ message: "password is required" })
      .min(6, "Password too short - it was 6 chars minimum"),
  }),
})

export const forgetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ message: "Email is required !" })
      .email("Not a valid mail!"),
  }),
})
export const resetPasswordSchema = z.object({
  body: z
    .object({
      password: z
        .string({ message: "password is required" })
        .min(6, "Password too short - it was 6 chars minimum"),
      passwordConfirmation: z.string({
        message: "passwordConfirmation is required",
      }),
      token: z.string({ message: "token is Required!" }),
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
        .string({ message: "password is required" })
        .min(6, "Password too short - it was 6 chars minimum"),
      newPassword: z
        .string({ message: "new Password is required" })
        .min(6, "Password too short - it was 6 chars minimum"),
      newPasswordConfirm: z.string({
        message: "confirm new password is required",
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
    gender: z.optional(z.enum(["male", "female"])),
    age: z.optional(z.number()),
  }),
})
const params = {
  params: z.object({
    id: z.string({
      message: "Add ID to params to get the associated user!",
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

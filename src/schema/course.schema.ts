import { z } from "zod"

const payload = z.object({
  title: z.string({ required_error: "Title is required to create course!" }),
  description: z.string({
    required_error: "description is required to create course!",
  }),
})
export const createCourseSchema = z.object({
  body: payload,
})

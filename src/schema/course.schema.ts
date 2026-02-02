import { z } from "zod"

const payload = z.object({
  title: z.string().min(1, "Title is required to create course!"),
  description: z.string().min(1, "description is required to create course!"),
})
export const createCourseSchema = z.object({
  body: payload,
})

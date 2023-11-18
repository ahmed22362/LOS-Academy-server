import { z } from "zod"

const sessionId = z.number()
const arabic = z.optional(z.string())
const islamic = z.optional(z.string())
const quran = z.optional(z.string())
const comment = z.optional(z.string())
const teacherId = z.string()
const grade = z.enum([
  "excellent",
  "good",
  "very good",
  "average",
  "below average",
])

const title = z.string()

export const createReportSchema = z.object({
  body: z.object({
    sessionId,
    arabic,
    islamic,
    quran,
    comment,
    teacherId,
    grade,
    title,
  }),
})

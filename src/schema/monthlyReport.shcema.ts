import { z } from "zod"

// userId,arabicToPage,arabicGrade,quranToPage,quranGrade,islamicToPage,islamicGrade,comment,
// "excellent","good","very good","average","below average",
const grade = z.optional(
  z.enum(["excellent", "good", "very good", "average", "below average"])
)
const userId = z.string({ required_error: "userId is required!" })
const arabicToPage = z.optional(
  z.number({ required_error: "page is required!" })
)
export const createMonthlyReportSchema = z.object({
  body: z.object({ userId, arabicToPage, grade }),
})

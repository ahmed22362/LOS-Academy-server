import { optional, z } from "zod"

// userId,arabicToPage,arabicGrade,quranToPage,quranGrade,islamicToPage,islamicGrade,comment,
// "excellent","good","very good","average","below average",
const topicGrade = (topic: string) =>
  z.optional(
    z.enum(["excellent", "good", "very good", "average", "below average"], {
      invalid_type_error: `${topic} grade input is not valid!`,
    })
  )
const userId = z.string({ required_error: "userId is required!" })
const topicToPage = (topic: string) =>
  z.optional(z.number({ required_error: `${topic} page is required!` }))
export const createMonthlyReportSchema = z.object({
  body: z.object({
    userId,
    arabicToPage: topicToPage("Arabic"),
    arabicGrade: topicGrade("Arabic"),
    quranGrade: topicGrade("Quran"),
    quranToPage: topicToPage("Quran"),
    islamicGrade: topicGrade("Islamic"),
    islamicToPage: topicToPage("Islamic"),
    comment: z.optional(z.string()),
  }),
})

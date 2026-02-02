import z from "zod"
// userId, feedBack

const userId = z.string()
const feedback = z.string()

export const createFeedbackSchema = z.object({
  body: z.object({ userId: userId.min(1, "please add userId"), feedback: feedback.min(1, "please add the feedback") }),
})

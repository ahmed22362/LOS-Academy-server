import z from "zod"
// userId, feedBack

const userId = z.string({ required_error: "please add userId" })
const feedback = z.string({ required_error: "please add the feedback" })

export const createFeedbackSchema = z.object({
  body: z.object({ userId, feedback }),
})

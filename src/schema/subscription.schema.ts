import { z } from "zod"

const sessionDuration = z.number({
  required_error: "SessionDuration must be provided",
})
const sessionsCount = z.number({
  required_error: "SessionsCount must be provided",
})
const sessionsPerWeek = z.number({
  required_error: "SessionsPerWeek must be provided",
})
const planId = z.number()

export const createCustomSubscriptionSchema = z.object({
  body: z
    .object({
      sessionDuration,
      sessionsCount,
      sessionsPerWeek,
      planId,
    })
    .partial()
    .refine(
      (data) =>
        data.planId ||
        (data.sessionDuration !== undefined &&
          data.sessionsCount !== undefined &&
          data.sessionsPerWeek !== undefined),
      {
        message: `Either planId or Custom must be provided custom plan contains "sessionDuration,sessionsCount,sessionsPerWeek"`,
      }
    ),
})

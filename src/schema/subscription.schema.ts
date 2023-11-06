import { z } from "zod"

const customPlanSchema = z.object({
  sessionDuration: z.number({
    required_error: "sessionDuration is required",
  }),
  sessionsCount: z.number({
    required_error:
      "sessionCount is required it's the total count in the month",
  }),
  sessionsPerWeek: z.number({
    required_error:
      "sessionsPerWeek is required it's the session per week the user will be take",
  }),
})
const standardPlanSchema = z.object({
  priceId: z.number({ required_error: "please enter the standard price id" }),
})
const compositeSchema = customPlanSchema.or(standardPlanSchema)

export const createSubscriptionSchema = z.object({
  body: standardPlanSchema,
})

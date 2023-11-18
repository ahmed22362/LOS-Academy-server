import { z } from "zod"

const planId = z.number({ required_error: "please provide plan Id" })
const sessionsCount = z.number({
  required_error: "please provide sessionCount",
})
const sessionDuration = z.number({
  required_error: "please provide sessionDuration",
})
const sessionsPerWeek = z.number({
  required_error: "Please provide SessionsPerWeek",
})

export const createStandardPlanSchema = z.object({
  sessionsCount,
  sessionDuration,
  title: z.string({
    required_error: "please provide title for this plan to show in home page",
  }),
  sessionsPerWeek,
})

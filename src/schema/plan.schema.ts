import { z } from "zod"
// sessionsCount,sessionDuration,title,sessionsPerWeek,type,recommended,discount,

const sessionsCount = z.number({
  required_error: "please provide sessionCount",
})
const sessionDuration = z.number({
  required_error: "please provide sessionDuration",
})
const sessionsPerWeek = z.number({
  required_error: "Please provide SessionsPerWeek",
})
const title = z.string({ required_error: "please provide title for this plan" })
const recommended = z.boolean({
  required_error: "please provide if this plan is recommended or not!",
})
const discount = z.number({
  required_error:
    "please enter if there is discount or not if there is no discount enter 0",
})
export const createStandardPlanSchema = z.object({
  sessionsCount,
  sessionDuration,
  title,
  recommended,
  discount,
  sessionsPerWeek,
})

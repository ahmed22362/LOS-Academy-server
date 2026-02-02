import { z } from "zod"
// sessionsCount,sessionDuration,title,sessionsPerWeek,type,recommended,discount,

const sessionsCount = z.number("please provide sessionsCount")
const sessionDuration = z.number("please provide sessionDuration")
const sessionsPerWeek = z.number("Please provide SessionsPerWeek")
const title = z.string("please provide title for this plan")
const recommended = z.boolean("please provide if this plan is recommended or not!")
const discount = z.number("please enter if there is discount or not if there is no discount enter 0")
export const createStandardPlanSchema = z.object({
  body: z.object({
    sessionsCount,
    sessionDuration,
    title,
    recommended,
    discount,
    sessionsPerWeek,
  }),
})

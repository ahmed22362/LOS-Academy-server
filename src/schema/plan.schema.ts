import { z } from "zod"

const payload = z.object({
  sessionsCount: z.number(),
  sessionDuration: z.number(),
  title: z.string(),
  sessionsPerWeek: z.number(),
  type: z.string(),
})
const createPlan = z.object({ body: payload })

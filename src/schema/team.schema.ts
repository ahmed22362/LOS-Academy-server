import { z } from "zod"
const payload = {
  body: z.object({
    userId: z.string({
      required_error: "please enter userId",
    }),
    teacherId: z.string({
      required_error: "please enter teacherId",
    }),
  }),
}
export const createTeamSchema = z.object({ ...payload })

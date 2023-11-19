import { z } from "zod"
const sessionId = z.number({
  required_error: "please provide sessionid in the boy!",
})
const teacherId = z.string({
  required_error: "Please provide teacherId in the body!",
})
const userId = z.string({
  required_error: "Please provide user id in the body!",
})
const sessionReqId = z.number({
  required_error: "please provide the session request id!",
})
const sessionInfoId = z.number({
  required_error: "please provide the session request id!",
})
const sessionDuration = z.number({
  required_error: "please provide the session request id!",
})

export const SessionStatusSchema = z.enum([
  "pending",
  "ongoing",
  "taken",
  "absent",
])
export const sessionDates = z
  .array(z.string())
  .refine((data) => data.length > 0, {
    message: "Array of Session Dates is required Received empty []",
  })
export const SessionTypeSchema = z.enum(["free", "paid", "not assign"])

export const generateLinkSchema = z.object({
  body: z.object({ sessionId, teacherId }),
})
export const updateSessionStatusSchema = z.object({
  body: z.object({ sessionId, teacherId, status: SessionStatusSchema }),
})
export const userContinueWithTeacherSchema = z.object({
  body: z.object({ sessionId }),
})
export const userPlacedSessionDatesSchema = z.object({
  body: z.object({ userId, sessionDates }),
})
export const assignTeacherSchema = z.object({
  body: z.object({ teacherId, sessionReqId }),
})
export const replaceSessionInfoTeacherSchema = generateLinkSchema
export const requireEitherTeacherOrUser = z.object({
  body: z
    .object({ teacherId, userId })
    .partial()
    .refine((data) => data.teacherId || data.userId, {
      message: "Either teacherId or userId must be provided",
    }),
})
export const createSessionRequestSchema = z.object({
  body: z.object({
    userId,
    sessionDates,
  }),
})
export const acceptSessionRequestSchema = z.object({
  body: z.object({ teacherId, sessionReqId }),
})
export const createSessionByAdminSchema = z.object({
  body: z
    .object({
      sessionInfoId,
      userId,
      teacherId,
      sessionDates,
      sessionDuration,
    })
    .partial()
    .refine(
      (data) =>
        data.sessionInfoId ||
        (data.userId !== undefined && data.teacherId !== undefined),
      { message: "please provide session info id or the userId and teacherId" }
    ),
})

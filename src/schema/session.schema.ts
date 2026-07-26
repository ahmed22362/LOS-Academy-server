import { z } from "zod";
const sessionId = z.number({
  message: "please provide sessionid in the body!",
});
const teacherId = z.string({
  message: "Please provide teacherId in the body!",
});
const userId = z.string({
  message: "Please provide user id in the body!",
});
const sessionReqId = z.number({
  message: "please provide the session request id!",
});
const sessionInfoId = z.number({
  message: "please provide the session request id!",
});
const sessionDuration = z.number({
  message: "please provide the session request id!",
});

export const SessionStatusSchema = z.enum([
  "pending",
  "ongoing",
  "taken",
  "user_absent",
  "teacher_absent",
  "both_absent",
]);
const sessionType = z.enum(["free", "paid"]);
export const sessionDates = z
  .array(z.string())
  .refine((data) => data.length > 0, {
    message: "Array of Session Dates is required Received empty []",
  });
export const courses = z.array(z.string()).refine((data) => data.length > 0, {
  message: "Please provide at least one course!",
});
export const SessionTypeSchema = z.enum(["free", "paid", "not assign"]);

export const generateLinkSchema = z.object({
  body: z.object({ sessionId, teacherId }),
});
export const updateSessionStatusSchema = z.object({
  body: z.object({ sessionId, status: SessionStatusSchema }),
});
export const userContinueWithTeacherSchema = z.object({
  body: z.object({
    sessionId,
    sessionDates,
  }),
});
export const userWontContinueWithTeacherSchema = z.object({
  body: z.object({
    sessionId,
    userId,
  }),
});
export const assignTeacherSchema = z.object({
  body: z.object({ teacherId, sessionReqId }),
});
export const cancelRequestSchema = z.object({
  body: z.object({
    requestId: z.number({
      message: "please enter the number of the request!",
    }),
  }),
});
export const replaceSessionInfoTeacherSchema = z.object({
  body: z.object({
    userId: z.string({ message: "please provide userId" }),
    oldTeacherId: z.string({
      message: "please provide oldTeacherId to be replaced",
    }),
    newTeacherId: z.string({
      message: "please provide newTeacherId to replace with",
    }),
  }),
});
export const requireEitherTeacherOrUser = z.object({
  body: z
    .object({ teacherId, userId })
    .partial()
    .refine((data) => data.teacherId || data.userId, {
      message: "Either teacherId or userId must be provided",
    }),
});
export const createSessionRequestSchema = z.object({
  body: z.object({
    userId,
    sessionDates,
    courses,
  }),
});
export const acceptSessionRequestSchema = z.object({
  body: z.object({ teacherId, sessionReqId }),
});
export const createSessionByAdminSchema = z.object({
  body: z.object({
    userId,
    teacherId,
    sessionDates,
    sessionDuration,
    sessionCount: z.number(),
    type: sessionType,
    sessionsPerWeek: z.number(),
  }),
});
export const getSessionCoursesSchema = z.object({
  query: z.object({
    sessionId: z.string({
      message: "please provide sessionId as query",
    }),
  }),
});
export const updateSessionAttendanceByAdmin = z.object({
  body: z.object({
    sessionId,
    teacherAttended: z.boolean().optional(),
    userAttended: z.boolean().optional(),
  }),
});
export const updateSessionContinuityByAdmin = z.object({
  body: z.object({
    sessionInfoId,
    status: z.boolean().nullable(),
  }),
});
export const updateSessionForAdminSchema = z.object({
  body: z.object({
    teacherAttended: z.boolean().optional(),
    studentAttended: z.boolean().optional(),
    sessionDate: z.string().optional(),
    status: SessionStatusSchema.optional(),
    reschedule_request_count: z.number().int().min(0).max(4).optional(),
    hasReport: z.boolean().optional(),
    meetingLink: z.string().nullable().optional(),
  }),
});

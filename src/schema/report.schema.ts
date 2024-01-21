import { z } from "zod";

const teacherId = z.string();

const CourseSchema = z.object({
  courseName: z.string(),
  courseGrade: z.enum([
    "excellent",
    "good",
    "very good",
    "average",
    "below average",
  ]),
  courseComment: z.string().optional(),
});

export const createReportSchema = z.object({
  body: z.object({
    sessionId: z.number(),
    teacherId,
    reportCourses: z.array(CourseSchema).optional(),
    comment: z.string().optional(),
    grade: z.enum([
      "excellent",
      "good",
      "very good",
      "average",
      "below average",
    ]),
  }),
});

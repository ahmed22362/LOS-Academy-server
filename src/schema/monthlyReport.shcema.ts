import { z } from "zod";
import { CourseSchema } from "./report.schema";

const userId = z.string({ required_error: "userId is required!" });
const teacherId = z.string({ required_error: "teacherId is required!" });
export const createMonthlyReportSchema = z.object({
  body: z.object({
    userId,
    teacherId,
    reportCourses: z.array(CourseSchema),
    comment: z.string(),
    grade: z.enum([
      "excellent",
      "good",
      "very good",
      "average",
      "below average",
    ]),
  }),
});

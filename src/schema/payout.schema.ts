import { z } from "zod";

const teacherId = z.string({ required_error: "Please add teacher id!" });
const amount = z.number({
  required_error: "please add the amount you want to request!",
});
const payoutId = z.number({
  required_error: "Please provide the requestId",
});
const status = z.enum(["pending", "done", "processing"]);
export const createPayoutSchema = z.object({
  body: z.object({ teacherId, amount }),
});
export const updatePayoutStatusSchema = z.object({
  body: z.object({ status, requestId: payoutId, amount }).optional(),
});

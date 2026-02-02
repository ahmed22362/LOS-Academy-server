import { z } from "zod";

const teacherId = z.string().nonempty("Please add teacher id!");
const amount = z.number().refine(val => val > 0, {
  message: "please add the amount you want to request!",
});
const payoutId = z.number().refine(val => val > 0, {
  message: "Please provide the requestId",
});
const status = z.enum(["pending", "done", "processing"]);
export const createPayoutSchema = z.object({
  body: z.object({ teacherId, amount }),
});
export const updatePayoutStatusSchema = z.object({
  body: z.object({ status, requestId: payoutId, amount }).optional(),
});

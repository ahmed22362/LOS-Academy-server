import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import { createSubscriptionService } from "../service/subscription.service"

export const createSubscription = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body)
    const userId = req.body.userId
    const planId = req.body.planId
    const { subscription, stripeSession } = await createSubscriptionService({
      body: { userId, planId },
    })
    res.redirect(stripeSession.url as string)
  }
)

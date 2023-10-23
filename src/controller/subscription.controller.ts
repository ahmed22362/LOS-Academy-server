import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import { createStripeSubscriptionService } from "../service/subscription.service"

export const createSubscription = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body.userId
    const planId = req.body.planId
    const successLink: string = `${req.protocol}://${req.get(
      "host"
    )}/success?session_id={CHECKOUT_SESSION_ID}`
    const failLink: string = `${req.protocol}://${req.get("host")}/`

    const stripeSession = await createStripeSubscriptionService({
      body: { userId, planId, success_url: successLink, cancel_url: failLink },
    })
    console.log(stripeSession.url as string)
    res.status(200).json({ status: "success", data: stripeSession })
  }
)

export const confirmSubscription = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
)

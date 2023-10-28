import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import {
  createStripeSubscriptionService,
  createSubscriptionService,
} from "../service/subscription.service"

export const createSubscription = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body.userId
    const planId = req.body.planId
    const successLink: string = `${req.protocol}://${req.get(
      "host"
    )}/?session_id={CHECKOUT_SESSION_ID}`
    const failLink: string = `${req.protocol}://${req.get("host")}/`

    const stripeCheckSession = await createStripeSubscriptionService({
      body: { userId, planId, success_url: successLink, cancel_url: failLink },
    })
    const subscriptionBody = {
      userId,
      planId,
      stripe_checkout_session_id: stripeCheckSession.id,
    }
    const subscription = await createSubscriptionService({
      body: subscriptionBody,
    })
    console.log(stripeCheckSession.url as string)
    res
      .status(200)
      .json({ status: "success", data: { stripeCheckSession, subscription } })
  }
)

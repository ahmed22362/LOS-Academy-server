import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import {
  checkPreviousUserSubreption,
  createStripeSubscriptionService,
  createSubscriptionService,
  getAllSubscriptionsService,
  updateSubscriptionService,
} from "../service/subscription.service"
import { createPlanService } from "../service/plan.service"

export const createSubscription = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body.userId
    let planId = req.body.planId
    const successLink: string = `${req.protocol}://${req.get(
      "host"
    )}/?session_id={CHECKOUT_SESSION_ID}`
    const failLink: string = `${req.protocol}://${req.get("host")}/`
    // check if there is active subscription
    const previousSubscription = await checkPreviousUserSubreption({ userId })
    if (previousSubscription) {
      const stripeCheckSession = await createStripeSubscriptionService({
        body: {
          userId: previousSubscription.userId,
          planId: previousSubscription.plan.id,
          success_url: successLink,
          cancel_url: failLink,
        },
      })
      await updateSubscriptionService({
        id: previousSubscription.id,
        updatedData: { stripe_checkout_session_id: stripeCheckSession.id },
      })
      return res
        .status(200)
        .json({ status: "success", data: stripeCheckSession })
    }
    if (!planId) {
      const sessionDuration = req.body.sessionDuration
      const sessionsCount = req.body.sessionsCount
      const sessionsPerWeek = req.body.sessionsPerWeek
      const plan = await createPlanService({
        data: {
          sessionDuration,
          sessionsCount,
          sessionsPerWeek,
          title: "custom plan",
        },
      })
      planId = plan.id
    }
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

export const updateSubscription = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    const { status } = req.body
    const updatedSubscription = await updateSubscriptionService({
      id: +id,
      updatedData: { status },
    })
    res.status(200).json({
      status: "success",
      message: "subscription updated successfully",
      data: updatedSubscription,
    })
  }
)

export const getAllUsersSubscriptions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const subscriptions = await getAllSubscriptionsService({})
    res.status(200).json({
      status: "success",
      length: subscriptions.length,
      data: subscriptions,
    })
  }
)

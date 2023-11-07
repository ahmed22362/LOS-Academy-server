import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import {
  checkPreviousUserSubreption,
  createStripeSubscriptionService,
  createSubscriptionService,
  getAllSubscriptionsService,
  handelSubscriptionPayed,
  handelSubscriptionPayedManually,
  updateSubscriptionService,
} from "../service/subscription.service"
import { createPlanService } from "../service/plan.service"
import Plan, { PlanType } from "../db/models/plan.model"
import User from "../db/models/user.model"
import { getUserAttr } from "./user.controller"
import { getPlanAtt } from "./plan.controller"
import { SubscriptionStatus } from "../db/models/subscription.model"
import { updateUserRemainSessionService } from "../service/user.service"
import { sequelize } from "../db/sequelize"
import AppError from "../utils/AppError"

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
          type: PlanType.CUSTOM,
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
    const t = await sequelize.transaction()
    try {
      const updatedSubscription = await updateSubscriptionService({
        id: +id,
        updatedData: { status },
        transaction: t,
      })
      if (status === SubscriptionStatus.ACTIVE) {
        await handelSubscriptionPayedManually({
          subscriptionId: +id,
          transaction: t,
        })
      }
      await t.commit()
      res.status(200).json({
        status: "success",
        message: "subscription updated successfully",
        data: updatedSubscription,
      })
    } catch (error: any) {
      await t.rollback()
      next(new AppError(400, `Error updating subscription: ${error.message}`))
    }
  }
)
export const getAllUsersSubscriptions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let page = req.query.page
    let limit = req.query.limit
    let nPage
    let nLimit
    let offset
    if (page && limit) {
      nPage = Number(page)
      nLimit = Number(limit)
      offset = nPage * nLimit
    }
    const subscriptions = await getAllSubscriptionsService({
      findOptions: {
        limit: nLimit,
        offset,
        include: [
          { model: Plan, attributes: getPlanAtt },
          { model: User, attributes: getUserAttr },
        ],
      },
    })
    res.status(200).json({
      status: "success",
      length: subscriptions.length,
      data: subscriptions,
    })
  }
)

import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import {
  createStripeSubscriptionService,
  createSubscriptionService,
  deleteSubscriptionService,
  getAllSubscriptionsService,
  getSubscriptionByUserId,
  handelSubscriptionPayedManually,
  updateSubscriptionService,
} from "../service/subscription.service"
import { createPlanService } from "../service/plan.service"
import Plan, { PlanType } from "../db/models/plan.model"
import User from "../db/models/user.model"
import { getUserAttr } from "./user.controller"
import { getPlanAtt } from "./plan.controller"
import { SubscriptionStatus } from "../db/models/subscription.model"
import { sequelize } from "../db/sequelize"
import AppError from "../utils/AppError"
import logger from "../utils/logger"

export const createSubscription = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body.userId
    let planId = req.body.planId
    const sessionDuration = req.body.sessionDuration
    const sessionsCount = req.body.sessionsCount
    const sessionsPerWeek = req.body.sessionsPerWeek
    const continueFlag = req.body.continueFlag
    let successLink: string = `https://los-academy.vercel.app/student_profile`
    if (continueFlag) {
      successLink += "?fromUserContinue=true"
    }
    const failLink: string = `https://los-academy.vercel.app/`
    // i should have the plan id to continue and if the user want custom plan i will create it!
    if (!planId) {
      const plan = await createPlanService({
        data: {
          sessionDuration,
          sessionsCount,
          sessionsPerWeek,
          title: "custom plan",
          type: PlanType.CUSTOM,
          recommended: false,
        },
      })
      planId = plan.id
    }
    // check if there is an previous subscription
    const previousSubscription = await getSubscriptionByUserId({
      userId,
    })
    if (previousSubscription) {
      //there is an active one can't subscribe again!
      if (previousSubscription.status === SubscriptionStatus.ACTIVE) {
        return next(
          new AppError(400, "Can't subscribe again there is an active one!")
        )
      }
      // here i will check if he want to repay or change the plan!
      // then i have to get the plan id first!
      if (previousSubscription.status === SubscriptionStatus.INCOMPLETE) {
        const stripeCheckSession = await createStripeSubscriptionService({
          body: {
            userId: previousSubscription.userId,
            planId,
            success_url: successLink,
            cancel_url: failLink,
          },
        })
        if (previousSubscription.planId === planId) {
          // then he want to repay
          await updateSubscriptionService({
            id: previousSubscription.id,
            updatedData: { stripe_checkout_session_id: stripeCheckSession.id },
          })
        } else {
          // then he want to change the plan
          await updateSubscriptionService({
            id: previousSubscription.id,
            updatedData: {
              stripe_checkout_session_id: stripeCheckSession.id,
              planId,
            },
          })
        }
        return res.status(200).json({
          status: "success",
          message:
            "the user want to repay or change his incomplete subscription",
          data: stripeCheckSession,
        })
      }
    }
    const stripeCheckSession = await createStripeSubscriptionService({
      body: { userId, planId, success_url: successLink, cancel_url: failLink },
    })
    const subscriptionBody = {
      userId,
      planId,
      stripe_checkout_session_id: stripeCheckSession.id,
    }
    await createSubscriptionService({
      body: subscriptionBody,
    })
    res.status(200).json({ status: "success", data: stripeCheckSession })
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
export const deleteSubscription = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    await deleteSubscriptionService({ subscriptionId: +id })
    res.status(200).json({
      status: "success",
      message: "subscription deleted successfully!",
    })
  }
)

import Stripe from "stripe"
import Subscription from "../db/models/subscription.model"
import {
  createModelService,
  getAllModelsByService,
  getModelByIdService,
  getOneModelByService,
  updateModelService,
} from "./factory.services"
import { getPlanService } from "./plan.service"
import { createStripeSession, getStripeSubscription } from "./stripe.service"
import { getUserByIdService } from "./user.service"
import AppError from "../utils/AppError"
import { FindOptions, Transaction } from "sequelize"
import { createSessionRequestService } from "./sessionReq.service"
import Plan from "../db/models/plan.model"
import { sequelize } from "../db/sequalize"

interface stripeCreateSubscription {
  userId: string
  planId: number
  success_url?: string
  cancel_url?: string
}

interface ICreateSubscription {
  stripe_subscription_id?: string
  stripe_checkout_session_id: string
  userId: string
  planId: number
  status?: string
}

export async function createStripeSubscriptionService({
  body,
}: {
  body: stripeCreateSubscription
}) {
  const user = await getUserByIdService({ userId: body.userId })
  const plan = await getPlanService({ id: body.planId })
  const stripeSession = await createStripeSession({
    priceId: plan.stripePriceId,
    customerId: user!.customerId as string,
    success_url: body.success_url as string,
    cancel_url: body.cancel_url as string,
  })
  return stripeSession
}
export async function createSubscriptionService({
  body,
}: {
  body: ICreateSubscription
}) {
  const subscription = await createModelService({
    ModelClass: Subscription,
    data: body,
  })
  return subscription
}
export async function updateSubscriptionService({
  id,
  updatedData,
  transaction,
}: {
  id: number
  updatedData: Partial<ICreateSubscription>
  transaction?: Transaction
}) {
  return await Subscription.update(updatedData, { where: { id }, transaction })
}

export async function getSubscriptionByID({
  id,
  findOptions,
}: {
  id: string
  findOptions?: FindOptions
}) {
  const subscription = await getModelByIdService({
    ModelClass: Subscription,
    Id: id,
    findOptions,
  })
  return subscription
}

export async function getSubscriptionByUserId({ userId }: { userId: string }) {
  const subscription = await getOneModelByService({
    Model: Subscription,
    findOptions: { where: { userId } },
  })
  return subscription
}
export async function getSubscriptionBy({
  findOptions,
}: {
  findOptions?: FindOptions
}) {
  const subscription = await getOneModelByService({
    Model: Subscription,
    findOptions,
  })
  if (!subscription) {
    throw new AppError(404, "can't find subscription!")
  }
  return subscription as Subscription
}

export async function getSubscriptionBySessionID(
  stripe_checkout_session_id: string
) {
  const membership = await getOneModelByService({
    Model: Subscription,
    findOptions: { where: { stripe_checkout_session_id }, include: Plan },
  })
  if (!membership) {
    throw new AppError(
      404,
      "There is no membership with this stripe checkout session id"
    )
  }
  return membership as Subscription
}
export async function getAllUserSubscriptions({ userId }: { userId: string }) {
  const subscriptions = await getAllModelsByService({
    Model: Subscription,
    findOptions: { where: { userId } },
  })
  return subscriptions
}
export async function getAllSubscriptionsService({
  findOptions,
}: {
  findOptions?: FindOptions
}) {
  const subscriptions = await getAllModelsByService({
    Model: Subscription,
    findOptions,
  })
  return subscriptions
}
export async function checkPreviousUserSubreption({
  userId,
}: {
  userId: string
}) {
  const previousSubscription = await getSubscriptionByUserId({
    userId,
  })
  if (previousSubscription && previousSubscription.status === "pending") {
    throw new AppError(
      400,
      "you can't subscribe to another when there is pending one!"
    )
  }
}
export async function handelSubscriptionCompleted(
  checkoutSession: Stripe.Checkout.Session
) {
  const t = await sequelize.transaction()
  try {
    const membership = await getSubscriptionBySessionID(checkoutSession.id)
    const stripeSubscription = await getStripeSubscription(
      checkoutSession.subscription as string
    )
    const user = await getUserByIdService({ userId: membership.userId })
    await updateSubscriptionService({
      id: membership.id,
      updatedData: {
        status: stripeSubscription.status,
        stripe_subscription_id: checkoutSession.subscription as string,
      },
      transaction: t,
    })
    user!.remainSessions += membership.plan.sessionsCount
    await user?.save({ transaction: t })
    await t.commit()
    console.log(user, membership)
  } catch (error: any) {
    await t.rollback()
    throw new AppError(400, `Error updating subscription ${error.message}`)
  }
}
export async function handelSubscriptionUpdated(
  checkoutSession: Stripe.Checkout.Session
) {
  const membership = await getSubscriptionBySessionID(checkoutSession.id)
  const stripeSubscription = await getStripeSubscription(
    checkoutSession.subscription as string
  )
  if (stripeSubscription.status === "canceled") {
    await membership.destroy()
  } else {
    await membership.update({ status: stripeSubscription.status })
  }
}

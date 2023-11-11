import Stripe from "stripe"
import Subscription, {
  SubscriptionStatus,
} from "../db/models/subscription.model"
import {
  createModelService,
  getAllModelsByService,
  getModelByIdService,
  getOneModelByService,
} from "./factory.services"
import { getPlanService } from "./plan.service"
import { createStripeSession, getStripeSubscription } from "./stripe.service"
import {
  getUserByIdService,
  getUserByService,
  updateUserRemainSessionService,
} from "./user.service"
import AppError from "../utils/AppError"
import { FindOptions, Transaction } from "sequelize"
import Plan from "../db/models/plan.model"
import { sequelize } from "../db/sequelize"
import logger from "../utils/logger"
import { getPlanAtt } from "../controller/plan.controller"
import User from "../db/models/user.model"
import { getUserAttr } from "../controller/user.controller"
import {
  scheduleSubscriptionCanceledMailJob,
  scheduleSuccessSubscriptionMailJob,
} from "../utils/scheduler"

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
  status?: SubscriptionStatus
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
  return subscription as Subscription
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
  const updated = await Subscription.update(updatedData, {
    where: { id },
    transaction,
    returning: true,
  })
  return updated
}
export async function getSubscriptionByID({
  id,
  findOptions,
}: {
  id: number
  findOptions?: FindOptions
}) {
  const subscription = await getModelByIdService({
    ModelClass: Subscription,
    Id: id,
    findOptions,
  })
  if (!subscription) {
    throw new AppError(404, "Can't find subscription with this id")
  }
  return subscription as Subscription
}

export async function getSubscriptionByUserId({ userId }: { userId: string }) {
  const subscription = await getOneModelByService({
    Model: Subscription,
    findOptions: { where: { userId }, include: Plan },
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
export async function getSubscriptionByStripeSubscriptionId(
  stripe_subscription_id: string
) {
  const membership = await getOneModelByService({
    Model: Subscription,
    findOptions: { where: { stripe_subscription_id }, include: Plan },
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
  if (
    previousSubscription &&
    previousSubscription.status !== SubscriptionStatus.ACTIVE
  ) {
    return previousSubscription
  } else return null
}
export async function handelCheckoutSessionCompleted(
  checkoutSession: Stripe.Checkout.Session
) {
  const t = await sequelize.transaction()
  try {
    const membership = await getSubscriptionBySessionID(checkoutSession.id)
    const stripeSubscription = await getStripeSubscription(
      checkoutSession.subscription as string
    )
    await updateSubscriptionService({
      id: membership.id,
      updatedData: {
        status: stripeSubscription.status as SubscriptionStatus,
        stripe_subscription_id: checkoutSession.subscription as string,
      },
      transaction: t,
    })
    await t.commit()
  } catch (error: any) {
    await t.rollback()
    throw new AppError(400, `Error updating subscription ${error.message}`)
  }
}
export async function handelSubscriptionPayed(
  payment_intent: Stripe.PaymentIntent
) {
  const t = await sequelize.transaction()
  try {
    const user = await getUserByService({
      findOptions: { where: { customerId: payment_intent.customer } },
    })
    const membership = await getSubscriptionByUserId({ userId: user?.id })
    await updateUserRemainSessionService({
      userId: user.id,
      amountOfSessions: membership.plan.sessionsCount,
    })
    scheduleSuccessSubscriptionMailJob({
      to: user.email,
      name: user.name,
      subscriptionAmount: membership.plan.price,
      subscriptionTitle: membership.plan.title,
      subscriptionCycle: "Monthly",
    })

    await t.commit()
  } catch (error: any) {
    await t.rollback()
    throw new AppError(400, `Error updating subscription ${error.message}`)
  }
}
export async function handelSubscriptionPayedManually({
  subscriptionId,
  transaction,
}: {
  subscriptionId: number
  transaction?: Transaction
}) {
  const membership = await getSubscriptionByID({
    id: subscriptionId,
    findOptions: {
      include: [
        { model: Plan, attributes: getPlanAtt },
        { model: User, attributes: getUserAttr },
      ],
    },
  })
  await updateUserRemainSessionService({
    userId: membership.userId,
    amountOfSessions: membership.plan.sessionsCount,
    transaction,
  })
}
export async function handelSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  const membership = await getSubscriptionByStripeSubscriptionId(
    subscription.id
  )
  if (subscription.status === "canceled") {
    const user = await getUserByIdService({ userId: membership.userId })
    await membership.destroy()
    scheduleSubscriptionCanceledMailJob({ to: user.email, name: user.name })
  } else {
    await membership.update({ status: subscription.status })
  }
}

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
import { FindOptions } from "sequelize"
import { createSessionRequestService } from "./sessionReq.service"

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
}: {
  id: number
  updatedData: Partial<ICreateSubscription>
}) {
  return await updateModelService({ ModelClass: Subscription, id, updatedData })
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
  const membership = (await getOneModelByService({
    Model: Subscription,
    findOptions: { where: { stripe_checkout_session_id } },
  })) as Subscription
  if (!membership) {
    throw new AppError(
      404,
      "There is no membership with this stripe checkout session id"
    )
  }
  return membership
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
  const membership = await getSubscriptionBySessionID(checkoutSession.id)
  const stripeSubscription = await getStripeSubscription(
    checkoutSession.subscription as string
  )
  console.log(membership, stripeSubscription, checkoutSession)

  await updateSubscriptionService({
    id: membership.id,
    updatedData: {
      status: stripeSubscription.status,
      stripe_subscription_id: checkoutSession.subscription as string,
    },
  })
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

import Subscription from "../db/models/subscription.model"
import { createModelService } from "./factory.services"
import { getPlanService } from "./plan.service"
import { createStripeSession } from "./stripe.service"
import { getUserByIdService } from "./user.service"

export async function createSubscriptionService({ body }: { body: any }) {
  console.log(body)
  const user = await getUserByIdService({ userId: body.userId })
  const plan = await getPlanService({ id: body.planId })
  const stripeSession = await createStripeSession({
    priceId: plan.stripePriceId,
    customerId: user!.customerId as string,
  })
  body.stripe_checkout_session_id = stripeSession.id
  console.log(stripeSession)
  const subscription = await createModelService({
    ModelClass: Subscription,
    data: body,
  })
  return { subscription, stripeSession }
}

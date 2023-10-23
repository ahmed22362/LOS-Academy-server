import { NextFunction, Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import { createWebhook, stripe } from "../service/stripe.service"
import Stripe from "stripe"

const webhookController = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let event: Stripe.Event | undefined

    event = stripe.webhooks.constructEvent(
      req.body,
      req.header("Stripe-Signature") || "",
      process.env.STRIPE_WEBHOOK_SECRET || ""
    )

    // Extract the object from the event.
    const dataObject: any = event.data.object

    switch (event.type) {
      case "invoice.payment_succeeded":
        if (dataObject["billing_reason"] === "subscription_create") {
          // The subscription automatically activates after successful payment
          // Set the payment method used to pay the first invoice
          // as the default payment method for that subscription
          const subscription_id = dataObject["subscription"]
          const payment_intent_id = dataObject["payment_intent"]

          // Retrieve the payment intent used to pay the subscription
          const payment_intent = await stripe.paymentIntents.retrieve(
            payment_intent_id
          )
        }
        break
      case "invoice.payment_failed":
        // If the payment fails or the customer does not have a valid payment method,
        // an invoice.payment_failed event is sent, and the subscription becomes past_due.
        // Use this webhook to notify your user that their payment has failed and to retrieve new card details.
        break
      case "invoice.finalized":
        // If you want to manually send out invoices to your customers
        // or store them locally to reference to avoid hitting Stripe rate limits.
        break
      case "customer.subscription.deleted":
        if (event.request != null) {
          // handle a subscription canceled by your request from above.
        } else {
          // handle subscription canceled automatically based upon your subscription settings.
        }
        break
      case "customer.subscription.trial_will_end":
        // Send a notification to your user that the trial will end
        break
      default:
      // Unexpected event type
    }
    res.sendStatus(200)
  }
)

export const webhook = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let event
    try {
      event = createWebhook(req.body, req.header("Stripe-Signature") || "")
    } catch (err) {
      console.log(err)
      return res.sendStatus(400)
    }

    const data = event.data.object
    console.log(event.type, data)

    res.sendStatus(200)
  }
)

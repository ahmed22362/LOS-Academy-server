import { Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import { stripe } from "../service/stripe.service"
import Stripe from "stripe"

import dotenv from "dotenv"
import {
  handelSubscriptionCompleted,
  handelSubscriptionUpdated,
} from "../service/subscription.service"

dotenv.config()

export const webhook = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event: Stripe.Event
    const rawBody = req.body as Buffer
    console.log(rawBody)
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        req.headers["stripe-signature"] || "",
        process.env.STRIPE_WEBHOOK_SECRET || ""
      )
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed. ${err}`)
      res.sendStatus(400)
      return
    }

    const data: Stripe.Event.Data = event
    const eventType: string = event.type
    switch (eventType) {
      case "customer.created":
        console.log("in suctomer subscription")
        break
      case "payment_intent.succeeded":
        console.log("in suctomer subscription")
        const pi: Stripe.PaymentIntent = data.object as Stripe.PaymentIntent
        // Funds have been captured
        // Fulfill any orders, e-mail receipts, etc
        // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds).
        console.log(`🔔  Webhook received: ${pi.object} ${pi.status}!`)
        console.log("💰 Payment captured!")
        break
      case "payment_intent.payment_failed": {
        console.log("in suctomer subscription")
        const pi: Stripe.PaymentIntent = data.object as Stripe.PaymentIntent
        console.log(`🔔  Webhook received: ${pi.object} ${pi.status}!`)
        console.log("❌ Payment failed.")
      }
      case "checkout.session.completed":
        {
          const checkoutSession = event.data.object as Stripe.Checkout.Session
          await handelSubscriptionCompleted(checkoutSession)
          console.log(`in session completed: ${checkoutSession}`)
        }
        break
      // the same as completed
      // case "customer.subscription.created": {
      //   console.log("in customer.subscription.created")
      // }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        console.log(
          "in customer subscription updated and deleted",
          "subscription.updated"
        )
        await handelSubscriptionUpdated(
          event.data.object as Stripe.Checkout.Session
        )
        break
      }
    }
    res.sendStatus(200)
  }
)

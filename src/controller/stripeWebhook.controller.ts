import { NextFunction, Request, Response, raw } from "express"
import catchAsync from "../utils/catchAsync"
import { stripe } from "../service/stripe.service"
import Stripe from "stripe"

import dotenv from "dotenv"

dotenv.config()

export const webhook = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event: Stripe.Event
    const rawBody = req.body as Buffer
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
        console.log(JSON.stringify(data))
        break
      case "payment_intent.succeeded":
        console.log(JSON.stringify(data))
        const pi: Stripe.PaymentIntent = data.object as Stripe.PaymentIntent
        // Funds have been captured
        // Fulfill any orders, e-mail receipts, etc
        // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds).
        console.log(`🔔  Webhook received: ${pi.object} ${pi.status}!`)
        console.log("💰 Payment captured!")
        break
      case "payment_intent.payment_failed": {
        console.log(JSON.stringify(data))
      }
      case "customer.subscription.created": {
        console.log(JSON.stringify(data))
      }
      case "customer.subscription.updated": {
        console.log("customer changed", JSON.stringify(data))
        break
      }
    }
    if (eventType === "payment_intent.succeeded") {
      // Cast the event into a PaymentIntent to make use of the types.
      const pi: Stripe.PaymentIntent = data.object as Stripe.PaymentIntent
      // Funds have been captured
      // Fulfill any orders, e-mail receipts, etc
      // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds).
      console.log(`🔔  Webhook received: ${pi.object} ${pi.status}!`)
      console.log("💰 Payment captured!")
    } else if (eventType === "payment_intent.payment_failed") {
      // Cast the event into a PaymentIntent to make use of the types.
      const pi: Stripe.PaymentIntent = data.object as Stripe.PaymentIntent
      console.log(`🔔  Webhook received: ${pi.object} ${pi.status}!`)
      console.log("❌ Payment failed.")
    }

    res.sendStatus(200)
  }
)

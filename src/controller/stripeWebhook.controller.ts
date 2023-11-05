import { Request, Response } from "express"
import catchAsync from "../utils/catchAsync"
import { stripe } from "../service/stripe.service"
import Stripe from "stripe"

import dotenv from "dotenv"
import {
  handelCheckoutSessionCompleted,
  handelSubscriptionPayed,
  handelSubscriptionUpdated,
} from "../service/subscription.service"
import logger from "../utils/logger"

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
        console.log("in customer creation")
        break
      case "payment_intent.succeeded":
        const payment_intent = event.data.object as Stripe.PaymentIntent
        await handelSubscriptionPayed(payment_intent)
        console.log(`🔔  Webhook received: ${"Event"}: ${payment_intent}!`)
        console.log("💰 Payment captured!")
        break
      case "payment_intent.payment_failed": {
        const pi: Stripe.PaymentIntent = data.object as Stripe.PaymentIntent
        console.log(`🔔  Webhook received: ${pi.object} ${pi.status}!`)
        console.log("❌ Payment failed.")
      }
      case "checkout.session.completed":
        {
          const checkoutSession = event.data.object as Stripe.Checkout.Session
          await handelCheckoutSessionCompleted(checkoutSession)
          console.log(`in session completed`)
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
        const checkoutSession = event.data.object as Stripe.Subscription
        await handelSubscriptionUpdated(checkoutSession)
        break
      }
    }
    res.sendStatus(200)
  }
)

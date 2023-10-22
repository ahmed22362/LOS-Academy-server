import Stripe from "stripe"
import dotenv from "dotenv"
import AppError from "../utils/AppError"
dotenv.config()
const sk_key = process.env.STRIPE_SECRET_KEY as string
export const stripe = new Stripe(sk_key, {
  apiVersion: "2023-10-16",
})

export async function createStripeCustomer({
  email,
  name,
  phone,
}: {
  email: string
  name: string
  phone: string
}) {
  const params: Stripe.CustomerCreateParams = {
    name,
    email,
    description: "test customer",
    phone,
  }
  try {
    const customer: Stripe.Customer = await stripe.customers.create(params)
    return customer
  } catch (error: any) {
    throw new AppError(
      400,
      `Error While creating stripe customer: ${error.message}`
    )
  }
}
export async function createStripePrice({
  amount,
  product,
  currency,
}: {
  amount: number
  product: string
  currency: string
}) {
  const params: Stripe.PriceCreateParams = {
    currency,
    recurring: { interval: "month" },
    active: true,
    unit_amount: amount * 100, // amount accept in cents,
    product,
  }
  try {
    const plan = await stripe.prices.create(params)
    return plan
  } catch (error: any) {
    throw new AppError(400, `Error While creating price: ${error.message}`)
  }
}
export async function createStripeProduct({ name }: { name: string }) {
  const params: Stripe.ProductCreateParams = {
    name,
  }
  try {
    const product = await stripe.products.create(params)
    return product
  } catch (error: any) {
    throw new AppError(400, `Error While creating product: ${error.message}`)
  }
}
export async function updateStripeProduct({
  productId,
  body,
}: {
  productId: string
  body: Stripe.ProductUpdateParams
}) {
  try {
    const product = await stripe.products.update(productId, body)
    return product
  } catch (error: any) {
    throw new AppError(400, `Error While updating product!: ${error.message}`)
  }
}
export async function deleteStripeProduct({
  productId,
}: {
  productId: string
}) {
  try {
    const product = await stripe.products.del(productId)
    return product
  } catch (error: any) {
    throw new AppError(400, `Error While Deleting product!: ${error.message}`)
  }
}

export async function createCheckOutSession({
  customerId,
  priceId,
}: {
  customerId: string
  priceId: string
}) {
  const params: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [
      {
        price: priceId,
      },
    ],
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
  }
  try {
    const session = await stripe.subscriptions.create(params)
    return session
  } catch (error: any) {
    throw new AppError(
      400,
      `Error While Creating subscriptions!: ${error.message}`
    )
  }
}

export async function createStripeSession({
  priceId,
  customerId,
}: {
  priceId: string
  customerId: string
}) {
  //   const successLink: string = `${req.protocol}://${req.get("host")}/success`
  const successLink: string = `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`
  //   const failLink: string = `${req.protocol}://${req.get("host")}/success`
  const failLink: string = `http://localhost:3000/cancel`

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer: customerId,
    success_url: successLink,
    cancel_url: failLink,
  }
  try {
    const session = await stripe.checkout.sessions.create(params)
    return session
  } catch (error: any) {
    throw new AppError(
      400,
      `Error While Creating subscriptions!: ${error.message}`
    )
  }
}

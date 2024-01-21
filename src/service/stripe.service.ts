import Stripe from "stripe";
import dotenv from "dotenv";
import AppError from "../utils/AppError";
dotenv.config();
const sk_key = process.env.STRIPE_SECRET_KEY as string;
export const stripe = new Stripe(sk_key, {
  apiVersion: "2023-10-16",
});

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function createStripeCustomer({
  email,
  name,
  phone,
}: {
  email: string;
  name: string;
  phone: string;
}) {
  const params: Stripe.CustomerCreateParams = {
    name,
    email,
    description: "test customer",
    phone,
  };
  try {
    const customer: Stripe.Customer = await stripe.customers.create(params);
    return customer;
  } catch (error: any) {
    throw new AppError(
      400,
      `Error While creating stripe customer: ${error.message}`,
    );
  }
}
export async function createStripePrice({
  amount,
  product,
  currency,
}: {
  amount: number;
  product: { name: string };
  currency: string;
}) {
  const params: Stripe.PriceCreateParams = {
    currency,
    recurring: { interval: "month", interval_count: 1 },
    active: true,
    unit_amount: amount * 100, // amount accept in cents,
    product_data: product,
  };
  try {
    const plan = await stripe.prices.create(params);
    return plan;
  } catch (error: any) {
    throw new AppError(400, `Error While creating price: ${error.message}`);
  }
}
export async function getStripePrice({ planId }: { planId: string }) {
  try {
    const plan = await stripe.plans.retrieve(planId);
    return plan;
  } catch (error: any) {
    console.error(400, `Error While Retrieving plan: ${error.message}`);
  }
}
export async function deleteStripePlan({ planId }: { planId?: string }) {
  try {
    if (!planId) {
      return;
    }
    const plan = await stripe.plans.del(planId);
  } catch (error: any) {
    console.error(400, `Error While deleting plan: ${error.message}`);
  }
}
export async function createStripeProduct({ name }: { name: string }) {
  const params: Stripe.ProductCreateParams = {
    name,
  };
  try {
    const product = await stripe.products.create(params);
    return product;
  } catch (error: any) {
    throw new AppError(400, `Error While creating product: ${error.message}`);
  }
}
export async function updateStripeProduct({
  productId,
  body,
}: {
  productId: string;
  body: Stripe.ProductUpdateParams;
}) {
  try {
    const product = await stripe.products.update(productId, body);
    return product;
  } catch (error: any) {
    throw new AppError(400, `Error While updating product!: ${error.message}`);
  }
}
export async function deleteStripeProduct({
  productId,
}: {
  productId: string;
}) {
  try {
    const product = await stripe.products.del(productId);
    return product;
  } catch (error: any) {
    console.error(400, `Error While Deleting product!: ${error.message}`);
  }
}
export async function createStripeSession({
  priceId,
  customerId,
  success_url,
  cancel_url,
  coupon,
}: {
  priceId: string;
  customerId: string;
  success_url: string;
  cancel_url: string;
  coupon?: string;
}) {
  //   const failLink: string = `${req.protocol}://${req.get("host")}/success`
  //   const successLink: string = `${req.protocol}://${req.get("host")}/success`

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer: customerId,
    success_url,
    cancel_url,
    discounts: [{ coupon }],
  };
  try {
    const session = await stripe.checkout.sessions.create(params);
    return session;
  } catch (error: any) {
    throw new AppError(
      400,
      `Error While Creating subscriptions!: ${error.message}`,
    );
  }
}
export async function createStripeBillingPortal(customerId: string) {
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
    });
    return portal;
  } catch (error: any) {
    throw new AppError(
      400,
      `Error While Creating subscriptions!: ${error.message}`,
    );
  }
}
export async function getStripeSubscription(id: string) {
  try {
    const subscribe = await stripe.subscriptions.retrieve(id);
    return subscribe;
  } catch (err: any) {
    console.error(404, `Error While retrieve subscription: ${err.message}`);
  }
}
export const createWebhook = (rawBody: any, sig: string) => {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    sig,
    STRIPE_WEBHOOK_SECRET,
  );
  return event;
};
export async function getStripeBalance() {
  const balance = await stripe.balance.retrieve();
  return balance;
}
export async function createStripeCouponOnce({
  percent_off,
}: {
  percent_off: number;
}) {
  const params: Stripe.CouponCreateParams = { percent_off, duration: "once" };
  const coupon = await stripe.coupons.create(params);
  return coupon;
}

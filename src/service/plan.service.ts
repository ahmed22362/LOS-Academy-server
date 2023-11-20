import { FindOptions } from "sequelize"
import Plan, { PlanType } from "../db/models/plan.model"
import {
  createModelService,
  deleteModelService,
  getModelByIdService,
  getModelsService,
  getOneModelByService,
  updateModelService,
} from "./factory.services"
import { createStripePrice, updateStripeProduct } from "./stripe.service"
import { planCreateInput } from "../controller/plan.controller"
import AppError from "../utils/AppError"
import { sequelize } from "../db/sequelize"
export const STANDARD_CURRENCY_USD = "usd"
const STANDARD_SESSION_MIN_PRICE = 0.5 // minute price is .5$
const STRIPE_PRODUCT_ID = "prod_OsxQ3q3vRj8fhT" // replace it to get if from course!

interface IPlanCreateData {
  currency: string
  sessionDuration: number
  sessionsCount: number
  sessionsPerWeek: number
  title: string
  stripePriceId?: string
  price: number
  type: PlanType
  discount?: number
}
export async function createPlanService({ data }: { data: planCreateInput }) {
  const plan = await getPlanBy({
    findOptions: {
      where: {
        sessionsCount: data.sessionsCount,
        sessionDuration: data.sessionDuration,
        sessionsPerWeek: data.sessionsPerWeek,
      },
    },
  })
  if (plan) {
    return plan
  }
  const price =
    data.sessionDuration * data.sessionsCount * STANDARD_SESSION_MIN_PRICE
  const stripeBody = {
    amount: price,
    product: { name: data.title ? data.title : "Custom Plan" },
    currency: STANDARD_CURRENCY_USD,
  }
  const planBody: IPlanCreateData = {
    currency: STANDARD_CURRENCY_USD,
    sessionDuration: data.sessionDuration,
    sessionsCount: data.sessionsCount,
    sessionsPerWeek: data.sessionsPerWeek,
    title: data.title,
    price,
    type: data.type,
    discount: data.discount,
  }
  const stripePlan = await createStripePrice(stripeBody)
  planBody.stripePriceId = stripePlan.id
  const newPlan = await Plan.create(planBody as any)
  return newPlan
}
export async function getPlansService({
  findOptions,
  page,
  limit,
}: {
  findOptions?: FindOptions
  page?: number
  limit?: number
}) {
  const plan = await getModelsService({
    ModelClass: Plan,
    findOptions,
    page,
    limit,
  })
  if (!plan) {
    throw new AppError(404, "Can't find plan with this id!")
  }
  return plan
}

export async function updatePlanService({
  id,
  updatedData,
}: {
  id: string | number
  updatedData: Partial<planCreateInput>
}) {
  const updatedPlan = await updateModelService({
    ModelClass: Plan,
    id,
    updatedData,
  })
  return updatedPlan
}
export async function deletePlanService({ id }: { id: string | number }) {
  return await deleteModelService({ ModelClass: Plan, id: id })
}
export async function getPlanService({ id }: { id: string | number }) {
  const plan = (await getModelByIdService({ ModelClass: Plan, Id: id })) as Plan
  if (!plan) {
    throw new AppError(404, "Can't find plan with this id!")
  }
  return plan
}
export async function getPlanBy({ findOptions }: { findOptions: FindOptions }) {
  const plan = await getOneModelByService({ Model: Plan, findOptions })
  return plan as Plan
}

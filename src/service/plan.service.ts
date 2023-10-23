import { FindOptions } from "sequelize"
import Plan from "../db/models/plan.model"
import {
  createModelService,
  deleteModelService,
  getModelByIdService,
  getModelsService,
  updateModelService,
} from "./factory.services"
import { getCourseService } from "./course.service"
import { createStripePrice } from "./stripe.service"
import Stripe from "stripe"
import { planCreateInput } from "../controller/plan.controller"

export async function createPlanService({ data }: { data: planCreateInput }) {
  const course = await getCourseService({ id: data.courseId })
  const body = {
    amount: data.price,
    product: course.stripeProductId,
    currency: data.currency,
  }
  const stripePlan = await createStripePrice(body)
  data.stripePriceId = stripePlan.id
  return await createModelService({ ModelClass: Plan, data })
}
export async function getPlansService({
  findOptions,
}: {
  findOptions?: FindOptions
}) {
  return await getModelsService({ ModelClass: Plan, findOptions })
}

export async function updatePlanService({
  id,
  updatedData,
}: {
  id: string | number
  updatedData: Partial<planCreateInput>
}) {
  return await updateModelService({ ModelClass: Plan, id, updatedData })
}
export async function deletePlanService({ id }: { id: string | number }) {
  return await deleteModelService({ ModelClass: Plan, id: id })
}
export async function getPlanService({ id }: { id: string | number }) {
  return (await getModelByIdService({ ModelClass: Plan, Id: id })) as Plan
}

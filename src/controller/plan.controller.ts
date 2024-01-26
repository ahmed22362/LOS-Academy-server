import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import {
  STANDARD_CURRENCY_USD,
  createPlanService,
  deletePlanService,
  getPlanBy,
  getPlanService,
  getPlansService,
  updatePlanService,
} from "../service/plan.service";
import AppError from "../utils/AppError";
import { PLAN_TABLE_NAME, PlanType } from "../db/models/plan.model";
import {
  createStripePrice,
  deleteStripePlan,
  deleteStripeProduct,
  getStripePrice,
  updateStripeProduct,
} from "../service/stripe.service";
import { getPaginationParameter } from "./user.controller";
import { estimateRowCount } from "../utils/getTableRowCount";

export interface planCreateInput {
  sessionDuration: number;
  sessionsCount: number;
  sessionsPerWeek: number;
  title: string;
  type: PlanType;
  recommended: boolean;
  discount?: number;
  price?: number;
  active?: boolean;
  stripePriceId?: string;
  product?: string;
}
export const getPlanAtt = [
  "title",
  "sessionDuration",
  "sessionsCount",
  "sessionsPerWeek",
  "price",
  "active",
  "recommended",
  "discount",
  "type",
];
export const createPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      sessionsCount,
      sessionDuration,
      title,
      sessionsPerWeek,
      type,
      recommended,
      discount,
      price,
    } = req.body;
    const body: planCreateInput = {
      sessionDuration,
      sessionsCount,
      sessionsPerWeek,
      title,
      type,
      recommended,
      discount,
      price,
    };
    const plan = await createPlanService({ data: body });
    if (!plan) {
      return next(
        new AppError(400, "Can't create Plan Some thing went wrong!"),
      );
    }
    res.status(200).json({ status: "success", data: plan });
  },
);
export const getPlans = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { offset, nLimit } = getPaginationParameter(req);
    const plans = await getPlansService({
      offset: offset,
      limit: nLimit,
      findOptions: { where: { type: PlanType.STANDARD } },
    });
    if (!plans) {
      return next(
        new AppError(400, "something wrong happened while getting plans"),
      );
    }
    res.status(200).json({
      status: "success",
      length: await estimateRowCount(PLAN_TABLE_NAME),
      data: plans,
    });
  },
);
export const updatePlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      sessionDuration,
      sessionsCount,
      recommended,
      sessionsPerWeek,
      active,
      title,
      discount,
      price,
      type,
    } = req.body;
    const id = req.params.id;
    const data = {
      title,
      sessionDuration,
      sessionsCount,
      sessionsPerWeek,
      recommended,
      active,
      discount,
      price,
      type,
    } as any;
    const plan = await getPlanBy({ findOptions: { where: { id } } });
    if (!plan) {
      return next(new AppError(404, "Can't find plan with this id!"));
    }
    if (price) {
      const oldStripePlan = await getStripePrice({
        planId: plan.stripePriceId,
      });
      const stripeProduct = oldStripePlan?.product;
      await deleteStripePlan({ planId: oldStripePlan?.id });
      await deleteStripeProduct({ productId: stripeProduct as string });
      const stripePlan = await createStripePrice({
        amount: price,
        product: { name: plan.title },
        currency: STANDARD_CURRENCY_USD,
      });
      data.stripePriceId = stripePlan.id;
    }
    if (title) {
      const oldStripePlan = await getStripePrice({
        planId: plan.stripePriceId,
      });
      await updateStripeProduct({
        productId: oldStripePlan?.product as string,
        body: { name: title },
      });
    }
    const updatedPlan = await updatePlanService({ id, updatedData: data });
    if (!updatedPlan) {
      return next(new AppError(404, "can't find plan to update"));
    }
    res.status(200).json({ status: "success", data: updatedPlan });
  },
);
export const deletePlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const plan = await getPlanBy({ findOptions: { where: { id } } });
    if (!plan) {
      next(new AppError(404, "Can't find plan with this id!"));
    }
    const oldStripePlan = await getStripePrice({ planId: plan.stripePriceId });
    const stripeProduct = oldStripePlan?.product;
    await deleteStripePlan({ planId: oldStripePlan?.id });
    await deleteStripeProduct({ productId: stripeProduct as string });
    await deletePlanService({ id });
    res
      .status(200)
      .json({ status: "success", message: "plan deleted successfully" });
  },
);
export const getPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const plan = await getPlanService({ id });
    if (!plan) {
      return next(new AppError(404, "can't find plan with this id!"));
    }
    res.status(200).json({ status: "success", data: plan });
  },
);

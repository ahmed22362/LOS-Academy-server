import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import {
  getTeacherByIdService,
  updateTeacherService,
} from "../service/teacher.service";
import AppError from "../utils/AppError";
import {
  createPayoutService,
  getAllPayoutService,
  getOnePayoutService,
  getTeacherPayoutsService,
  updatePayoutService,
} from "../service/payout.service";
import { sequelize } from "../db/sequelize";
import { schedulePayoutMailJob } from "../utils/scheduler";
import { getPaginationParameter } from "./user.controller";

export const createPayout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { amount, teacherId } = req.body;
    const teacher = await getTeacherByIdService({ id: teacherId });
    if (amount > teacher.balance) {
      return next(
        new AppError(400, "Can't make payout more than teacher balance!"),
      );
    }
    const transaction = await sequelize.transaction();
    try {
      const payOutRequest = await createPayoutService({
        teacherId,
        amount,
        transaction,
      });

      await updateTeacherService({
        updatedData: { balance: teacher.balance - amount, committed_mins: 0 },
        teacherId,
        transaction,
      });
      schedulePayoutMailJob({
        teacherName: teacher.name,
        amount,
        teacherEmail: teacher.email,
      });
      await transaction.commit();
      res.status(200).json({
        status: "success",
        message:
          "The Request placed successfully and waiting for admin response",
        data: payOutRequest,
      });
    } catch (error: any) {
      await transaction.rollback();
      throw new AppError(400, `Error Creating Payout: ${error.message}`);
    }
  },
);
export const getAllPayouts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { offset, nLimit } = getPaginationParameter(req);
    const requests = await getAllPayoutService({
      offset,
      limit: nLimit,
    });
    res.status(200).json({
      status: "success",
      length: requests.count,
      data: requests.rows,
    });
  },
);
export const getMyPayouts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let teacherId = req.body.teacherId;
    if (!teacherId) teacherId = req.query.teacherId;
    const payouts = await getTeacherPayoutsService({
      teacherId,
    });
    res
      .status(200)
      .json({ status: "success", data: payouts.rows, length: payouts.count });
  },
);
export const getTeacherPayouts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teacherId = req.query.teacherId;
    const payouts = await getTeacherPayoutsService({
      teacherId: teacherId as string,
    });
    res
      .status(200)
      .json({ status: "success", data: payouts.rows, length: payouts.count });
  },
);
export const getOnePayout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const payout = await getOnePayoutService({ requestId: +id });
    res.status(200).json({ status: "success", data: payout });
  },
);
export const updateAmountPayout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { amount, status } = req.body;
    const id = req.params.id;
    const payout = await getOnePayoutService({ requestId: +id });
    const teacher = await getTeacherByIdService({ id: payout.teacherId });
    if (amount > teacher.balance) {
      return next(
        new AppError(400, "Can't update payout more than teacher balance!"),
      );
    }
    const updatedPayout = await updatePayoutService({
      requestId: payout.id,
      amount,
      status,
    });
    res.status(200).json({
      status: "success",
      message: "payout updated successfully!",
      updatedPayout,
    });
  },
);
export const deletePayout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.body;
    const payout = await getOnePayoutService({ requestId: id });
    await payout.destroy();
    res.status(200).json({
      status: "success",
      message: "payout deleted successfully!",
    });
  },
);

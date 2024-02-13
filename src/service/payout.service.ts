import { Transaction, WhereOptions } from "sequelize";
import { getTeacherAtt } from "../controller/teacher.controller";
import PayOut, { PayoutStatus } from "../db/models/payout.model";
import Teacher from "../db/models/teacher.model";
import AppError from "../utils/AppError";
import { createModelService, updateModelService } from "./factory.services";

export async function createPayoutService({
  teacherId,
  amount,
  transaction,
}: {
  teacherId: string;
  amount: number;
  transaction?: Transaction;
}) {
  const payout = await PayOut.create({ teacherId, amount } as any, {
    transaction,
  });
  return payout;
}
export async function getOnePayoutService({
  requestId,
}: {
  requestId: number;
}) {
  const payoutReq = await PayOut.findByPk(requestId, {
    include: [{ model: Teacher, attributes: getTeacherAtt }],
  });
  if (!payoutReq) {
    throw new AppError(404, "Can't find request with this id!");
  }
  return payoutReq;
}
export async function getAllPayoutService({
  offset,
  limit,
}: {
  offset?: number;
  limit?: number;
}) {
  const requests = await PayOut.findAndCountAll({
    include: [{ model: Teacher, attributes: getTeacherAtt }],
    limit: limit,
    offset,
  });
  return requests;
}
export async function updatePayoutService({
  requestId,
  status,
  amount,
  transaction,
}: {
  requestId: number;
  status?: PayoutStatus;
  amount?: number;
  transaction?: Transaction;
}) {
  const updatedData: any = {};
  if (status) updatedData.status = status;
  if (amount) updatedData.amount = amount;
  const updatedRequest = await updateModelService({
    ModelClass: PayOut,
    id: requestId,
    updatedData,
    transaction,
  });
  return updatedRequest as PayOut;
}
export async function deletePayoutService({
  requestId,
}: {
  requestId: number;
}) {
  const payout = await getOnePayoutService({ requestId });
  await payout.destroy();
}
export async function getTeacherPayoutsService({
  teacherId,
  status,
}: {
  teacherId: string;
  status?: string;
}) {
  const where: WhereOptions = { teacherId };
  if (status) where.status = status;
  const payouts = await PayOut.findAndCountAll({ where });
  return payouts;
}

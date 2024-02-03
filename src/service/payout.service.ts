import { FindOptions, Transaction, WhereOptions } from "sequelize";
import { getTeacherAtt } from "../controller/teacher.controller";
import PayOutRequest, {
  PayoutRequestStatus,
} from "../db/models/payoutReq.model";
import Teacher from "../db/models/teacher.model";
import AppError from "../utils/AppError";
import { createModelService, updateModelService } from "./factory.services";

export async function createPayoutRequestService({
  teacherId,
  amount,
}: {
  teacherId: string;
  amount: number;
}) {
  const payoutReq = await createModelService({
    ModelClass: PayOutRequest,
    data: { teacherId, amount },
  });
  return payoutReq as PayOutRequest;
}
export async function getOnePayoutRequestService({
  requestId,
}: {
  requestId: number;
}) {
  const payoutReq = await PayOutRequest.findByPk(requestId, {
    include: [{ model: Teacher, attributes: getTeacherAtt }],
  });
  if (!payoutReq) {
    throw new AppError(404, "Can't find request with this id!");
  }
  return payoutReq;
}
export async function getAllPayoutRequestService({
  offset,
  limit,
}: {
  offset?: number;
  limit?: number;
}) {
  const requests = await PayOutRequest.findAndCountAll({
    include: [{ model: Teacher, attributes: getTeacherAtt }],
    limit: limit,
    offset,
  });
  return requests;
}
export async function updatePayoutRequestService({
  requestId,
  status,
  amount,
  transaction,
}: {
  requestId: number;
  status?: PayoutRequestStatus;
  amount?: number;
  transaction?: Transaction;
}) {
  const updatedData: any = {};
  if (status) updatedData.status = status;
  if (amount) updatedData.amount = amount;
  const updatedRequest = await updateModelService({
    ModelClass: PayOutRequest,
    id: requestId,
    updatedData,
    transaction,
  });
  return updatedRequest as PayOutRequest;
}
export async function deletePayoutRequestService({
  requestId,
}: {
  requestId: number;
}) {
  const payout = await getOnePayoutRequestService({ requestId });
  await payout.destroy();
}
export async function getTeacherPayoutRequestsService({
  teacherId,
  status,
}: {
  teacherId: string;
  status?: string;
}) {
  const where: WhereOptions = { teacherId };
  if (status) where.status = status;
  const payouts = await PayOutRequest.findAll({ where });
  return payouts;
}

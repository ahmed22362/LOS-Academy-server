import Teacher from "../db/models/teacher.model";
import { FindOptions, Transaction } from "sequelize";
import { ITeacherInput } from "../db/models/teacher.model";
import {
  createModelService,
  deleteModelService,
  getOneModelByService,
  updateModelService,
} from "./factory.services";
import { createStripeCustomer } from "./stripe.service";
import AppError from "../utils/AppError";
import SessionInfo from "../db/models/sessionInfo.model";
import User from "../db/models/user.model";
import { getUserAttr } from "../controller/user.controller";

export async function createTeacherService(body: ITeacherInput) {
  const stripeCustomer = await createStripeCustomer({
    email: body.email,
    name: body.name,
    phone: body.phone,
  });
  body.customerId = stripeCustomer.id;
  return await createModelService({ ModelClass: Teacher, data: body });
}
export async function deleteTeacherService({ id }: { id: string | number }) {
  return await deleteModelService({ ModelClass: Teacher, id: id });
}
export async function getTeacherByIdService({
  id,
  findOptions,
}: {
  id: string | number;
  findOptions?: FindOptions;
}) {
  const teacher = await Teacher.findByPk(id, findOptions);
  if (!teacher) {
    throw new AppError(404, "Can't find teacher with this id!");
  }
  return teacher;
}
export async function getTeachersService({
  findOptions,
}: {
  findOptions?: FindOptions;
}) {
  return await Teacher.findAndCountAll(findOptions);
}
export async function updateTeacherService({
  updatedData,
  teacherId,
  transaction,
}: {
  updatedData: Partial<Teacher>;
  teacherId: string;
  transaction?: Transaction;
}) {
  return await updateModelService({
    ModelClass: Teacher,
    id: teacherId,
    updatedData: updatedData,
    transaction,
  });
}
export async function updateTeacherCommittedMins({
  teacherId,
  mins,
  transaction,
}: {
  teacherId: string;
  mins: number;
  transaction?: Transaction;
}) {
  const updated = await Teacher.increment(
    { committed_mins: mins },
    {
      where: { id: teacherId },
      transaction,
    },
  );
  return updated;
}
export async function updateTeacherBalance({
  teacherId,
  amount,
  transaction,
}: {
  teacherId: string;
  amount: number;
  transaction?: Transaction;
}) {
  // Round amount to 2 decimal places for consistency
  const roundedAmount = Math.round((amount + Number.EPSILON) * 100) / 100;
  
  const teacher = await Teacher.findByPk(teacherId, { transaction });
  if (!teacher) {
    throw new AppError(404, 'Teacher not found');
  }

  const currentBalance = teacher.balance;
  const newBalance = currentBalance + roundedAmount;

  // Prevent extremely negative balances (allow some negative for teacher penalties)
  const minimumAllowedBalance = -1000; // Allow up to $1000 negative balance
  if (newBalance < minimumAllowedBalance) {
    throw new AppError(
      400, 
      `Operation would result in balance of $${newBalance.toFixed(2)}, which is below minimum allowed balance of $${minimumAllowedBalance}`
    );
  }

  // Update using direct update to ensure atomic operation
  const [updatedCount] = await Teacher.update(
    { balance: Number(newBalance.toFixed(2)) }, // Ensure 2 decimal places
    {
      where: { id: teacherId },
      transaction,
    },
  );

  if (updatedCount === 0) {
    throw new AppError(404, 'Failed to update teacher balance');
  }

  return updatedCount;
}

// Utility function to calculate teacher payment for session
export function calculateTeacherSessionPayment(
  hourCost: number, 
  sessionDurationMinutes: number
): number {
  const costPerMinute = hourCost / 60;
  const totalAmount = costPerMinute * sessionDurationMinutes;
  // Round to 2 decimal places
  return Math.round((totalAmount + Number.EPSILON) * 100) / 100;
}
export async function getTeacherByService({
  findOptions,
}: {
  findOptions: FindOptions;
}): Promise<Teacher | null> {
  return await getOneModelByService({ Model: Teacher, findOptions });
}

export async function getTeacherStudentsService({
  teacherId,
  limit,
  offset,
}: {
  teacherId: string;
  limit?: number;
  offset?: number;
}) {
  const { rows, count } = await SessionInfo.findAndCountAll({
    where: { teacherId, willContinue: true },
    include: [{ model: User, attributes: getUserAttr }],
    limit,
    offset,
  });
  const students = rows.map((info) => info.user);
  const unique: User[] = [
    ...new Set(students.map((item) => JSON.stringify(item))),
  ].map((item) => JSON.parse(item));
  return { unique, count };
}

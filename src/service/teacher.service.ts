import Teacher from "../db/models/teacher.model";
import { FindOptions, Op, Transaction } from "sequelize";
import { ITeacherInput } from "../db/models/teacher.model";
import {
  createModelService,
  deleteModelService,
  getAllModelsByService,
  getModelByIdService,
  getModelsService,
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
}: {
  updatedData: Partial<Teacher>;
  teacherId: string;
}) {
  return await updateModelService({
    ModelClass: Teacher,
    id: teacherId,
    updatedData: updatedData,
  });
}
export async function updateTeacherBalance({
  teacherId,
  amount,
  mins,
  committed,
  transaction,
}: {
  teacherId: string;
  amount?: number;
  committed?: boolean;
  mins?: number;
  transaction?: Transaction;
}) {
  const teacher = await getTeacherByIdService({ id: teacherId });
  if (!amount) {
    amount = (mins ?? 0) * (teacher.hour_cost / 60);
  }
  const updated = await teacher.increment(
    { balance: amount ?? 0, committed_mins: committed ? mins : 0 },
    {
      transaction,
    },
  );
  return updated;
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
    where: { teacherId },
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

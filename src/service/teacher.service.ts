import Teacher from "../db/models/teacher.model"
import { FindOptions } from "sequelize"
import { ITeacherInput } from "../db/models/teacher.model"
import {
  createModelService,
  deleteModelService,
  getModelByIdService,
  getModelsService,
  getOneModelByService,
  updateModelService,
} from "./factory.services"
import { createStripeCustomer } from "./stripe.service"
import AppError from "../utils/AppError"

export async function createTeacherService(body: ITeacherInput) {
  const stripeCustomer = await createStripeCustomer({
    email: body.email,
    name: body.name,
    phone: body.phone,
  })
  body.customerId = stripeCustomer.id
  return await createModelService({ ModelClass: Teacher, data: body })
}
export async function deleteTeacherService({ id }: { id: string | number }) {
  return await deleteModelService({ ModelClass: Teacher, id: id })
}
export async function getTeacherByIdService({
  id,
  findOptions,
}: {
  id: string | number
  findOptions?: FindOptions
}) {
  const teacher = await getModelByIdService({
    ModelClass: Teacher,
    Id: id,
    findOptions,
  })
  if (!teacher) {
    throw new AppError(404, "Can't find teacher with this id!")
  }
  return teacher as Teacher
}
export async function getTeachersService({
  findOptions,
}: {
  findOptions?: FindOptions
}) {
  return await getModelsService({ ModelClass: Teacher, findOptions })
}

export async function updateTeacherService({
  updatedData,
  teacherId,
}: {
  updatedData: Partial<Teacher>
  teacherId: string
}) {
  return await updateModelService({
    ModelClass: Teacher,
    id: teacherId,
    updatedData: updatedData,
  })
}

export async function getTeacherByService({
  findOptions,
}: {
  findOptions: FindOptions
}): Promise<Teacher | null> {
  return await getOneModelByService({ Model: Teacher, findOptions })
}

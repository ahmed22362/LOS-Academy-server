import Teacher from "../db/models/teacher.model"
import { FindOptions } from "sequelize"
import { ITeacherInput } from "../db/models/teacher.model"
import {
  createModelService,
  deleteModelService,
  getModelByIdService,
  getModelByService,
  getModelsService,
  updateModelService,
} from "./factory.services"
import { createStripeCustomer } from "../connect/stripe"

export async function createTeacherService(body: ITeacherInput) {
  const stripeCustomer = await createStripeCustomer({
    email: body.email,
    name: `${body.fName} ${body.lName}`,
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
  return await getModelByIdService({ ModelClass: Teacher, Id: id, findOptions })
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
  return await getModelByService({ Model: Teacher, findOptions })
}

import Teacher from "../db/models/teacher.model"
import { FindOptions } from "sequelize"
import { ITeacherInput } from "../db/models/teacher.model"
import {
  createModelService,
  deleteModelService,
  getAllModelsByService,
  getModelByIdService,
  getModelsService,
  getOneModelByService,
  updateModelService,
} from "./factory.services"
import { createStripeCustomer } from "./stripe.service"
import AppError from "../utils/AppError"
import SessionInfo from "../db/models/sessionInfo.model"
import User from "../db/models/user.model"
import { getUserAttr } from "../controller/user.controller"

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
export async function getTeacherStudentsService({
  teacherId,
}: {
  teacherId: String
}) {
  const sessionInfos = (await getAllModelsByService({
    Model: SessionInfo,
    findOptions: { include: { model: User, attributes: getUserAttr } },
  })) as SessionInfo[]
  const students = sessionInfos.map((info) => info.user)
  const unique = [...new Set(students.map((item) => JSON.stringify(item)))].map(
    (item) => JSON.parse(item)
  )
  return unique
}

import { FindOptions } from "sequelize"
import Material, { MaterialStatus } from "../db/models/material.model"
import AppError from "../utils/AppError"
import { updateModelService } from "./factory.services"
import dotenv from "dotenv"
import B2Client from "../utils/b2client"
dotenv.config()

interface IMaterialBody {
  teacherId: string
  name: string
  course: string
  age: number
  status: MaterialStatus
  b2Link: string
  b2FileId: string
}
export async function createMaterialService({ body }: { body: IMaterialBody }) {
  try {
    const material = Material.create(body as any)
    return material
  } catch (error: any) {
    throw new AppError(400, `Error Creating material: ${error.message}`)
  }
}

export async function getAllMaterialService({
  findOptions,
}: {
  findOptions?: FindOptions
}) {
  try {
    const materials = await Material.findAll(findOptions)
    return materials
  } catch (error: any) {
    throw new AppError(400, `Error Creating material: ${error.message}`)
  }
}
export async function getOneMaterialService({
  materialId,
  findOptions,
}: {
  materialId: number
  findOptions?: FindOptions
}) {
  const material = await Material.findByPk(materialId, findOptions)
  if (!material) {
    throw new AppError(404, "Can't find material with this id!")
  }
  return material
}
export async function updateMaterialService({
  materialId,
  body,
}: {
  materialId: number
  body: Partial<IMaterialBody>
}) {
  const updatedMaterial = await updateModelService({
    ModelClass: Material,
    id: materialId,
    updatedData: body,
  })
  return updatedMaterial
}
export async function deleteMaterialService({
  materialId,
}: {
  materialId: number
}) {
  try {
    const material = await getOneMaterialService({ materialId })
    const keyId = process.env.B2_KEY_ID || ""
    const applicationKey = process.env.B2_APPLICATION_KEY || ""
    const b2client = new B2Client(keyId, applicationKey)
    await b2client.deleteFile(material.b2FileId)
    await material.destroy()
  } catch (error: any) {
    throw new AppError(400, `Error deleting file: ${error.message}`)
  }
}
export async function getTeacherMaterialsService({
  teacherId,
}: {
  teacherId: string
}) {
  console.log(teacherId)
  const materials = await Material.findAll({ where: { teacherId } })
  return materials
}

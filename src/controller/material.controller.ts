import { Request, NextFunction, Response } from "express"
import catchAsync from "../utils/catchAsync"
import {
  createMaterialService,
  deleteMaterialService,
  getAllMaterialService,
  getOneMaterialService,
  getTeacherMaterialsService,
  updateMaterialService,
} from "../service/material.service"
import Teacher from "../db/models/teacher.model"
import { getTeacherAtt } from "./teacher.controller"

const materialAttr = [
  "id",
  "teacherId",
  "name",
  "course",
  "age",
  "status",
  "b2Link",
  "createdAt",
]

export const createMaterial = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { teacherId, name, age, course, status } = req.body

    const materials = await Promise.all(
      res.locals.fileData.map(async (file: any) => {
        const body = {
          teacherId,
          age: +age,
          course,
          status,
          name: name,
          b2Link: file.fileUrl,
          b2FileId: file.fileId,
        }
        const material = await createMaterialService({ body })
        return material
      })
    )
    console.log("this is withoud await ", materials)
    res.status(200).json({ status: "success", data: materials })
  }
)
export const getAllMaterial = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let page = req.query.page
    let limit = req.query.limit
    let nPage
    let nLimit
    let offset
    if (page && limit) {
      nPage = Number(page)
      nLimit = Number(limit)
      offset = nPage * nLimit
    }
    const materials = await getAllMaterialService({
      findOptions: {
        include: [{ model: Teacher, attributes: getTeacherAtt }],
        attributes: materialAttr,
        limit: nLimit,
        offset,
        order: ["id"],
      },
    })
    res.status(200).json({ status: "success", data: materials })
  }
)
export const getOneMaterial = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sMaterialId = req.params.id
    const materialId = parseInt(sMaterialId)
    const material = await getOneMaterialService({
      materialId,
      findOptions: { include: [{ model: Teacher, attributes: getTeacherAtt }] },
    })
    res.status(200).json({ status: "success", data: material })
  }
)
export const updateOneMaterial = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sMaterialId = req.params.id
    const materialId = parseInt(sMaterialId)
    const { name, age, course, status } = req.body
    const updatedMaterial = await updateMaterialService({
      materialId,
      body: { name, age, course, status },
    })
    res.status(200).json({
      status: "success",
      message: "material updated successfully",
      data: updatedMaterial,
    })
  }
)
export const deleteOneMaterial = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sMaterialId = req.params.id
    const materialId = parseInt(sMaterialId)
    await deleteMaterialService({ materialId })
    res
      .status(200)
      .json({ status: "success", message: "material deleted successfully!" })
  }
)
export const getMyMaterial = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teacherId = req.body.teacherId
    const materials = await getTeacherMaterialsService({ teacherId })
    res.status(200).json({ status: "success", data: materials })
  }
)

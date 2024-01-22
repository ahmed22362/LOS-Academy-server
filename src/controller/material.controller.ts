import { Request, NextFunction, Response } from "express";
import catchAsync from "../utils/catchAsync";
import {
  createMaterialService,
  deleteMaterialService,
  getAllMaterialService,
  getOneMaterialService,
  getTeacherMaterialsService,
  updateMaterialService,
} from "../service/material.service";
import Teacher from "../db/models/teacher.model";
import { getTeacherAtt } from "./teacher.controller";
import AppError from "../utils/AppError";
import { estimateRowCount } from "../utils/getTableRowCount";
import { MATERIAL_TABLE_NAME } from "../db/models/material.model";
import { getPaginationParameter } from "./user.controller";

const materialAttr = [
  "id",
  "teacherId",
  "name",
  "course",
  "age",
  "status",
  "b2Link",
  "createdAt",
];

export const createMaterial = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { teacherId, name, age, course, status } = req.body;
    const file = res.locals.fileData;
    if (!file) {
      return next(new AppError(400, "No file uploaded."));
    }
    const body = {
      teacherId,
      age: +age,
      course,
      status,
      name: name,
      b2Link: file.fileUrl,
      b2FileId: file.fileId,
    };

    const material = await createMaterialService({ body });
    res.status(200).json({
      status: "success",
      length: await estimateRowCount(MATERIAL_TABLE_NAME),
      data: material,
    });
  },
);
export const getAllMaterial = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { nLimit, offset } = getPaginationParameter(req);
    const materials = await getAllMaterialService({
      findOptions: {
        include: [{ model: Teacher, attributes: getTeacherAtt }],
        attributes: materialAttr,
        limit: nLimit,
        offset,
        order: ["id"],
      },
    });
    res.status(200).json({ status: "success", data: materials });
  },
);
export const getOneMaterial = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sMaterialId = req.params.id;
    const materialId = parseInt(sMaterialId);
    const material = await getOneMaterialService({
      materialId,
      findOptions: { include: [{ model: Teacher, attributes: getTeacherAtt }] },
    });
    res.status(200).json({ status: "success", data: material });
  },
);
export const updateOneMaterial = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sMaterialId = req.params.id;
    const materialId = parseInt(sMaterialId);
    const { name, age, course, status } = req.body;
    const updatedMaterial = await updateMaterialService({
      materialId,
      body: { name, age, course, status },
    });
    res.status(200).json({
      status: "success",
      message: "material updated successfully",
      data: updatedMaterial,
    });
  },
);
export const deleteOneMaterial = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sMaterialId = req.params.id;
    const materialId = parseInt(sMaterialId);
    await deleteMaterialService({ materialId });
    res
      .status(200)
      .json({ status: "success", message: "material deleted successfully!" });
  },
);
export const getMyMaterial = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teacherId = req.body.teacherId;
    const materials = await getTeacherMaterialsService({ teacherId });
    res.status(200).json({ status: "success", data: materials });
  },
);

import { FindOptions, Transaction } from "sequelize";
import AppError from "../utils/AppError";
import { Model } from "sequelize-typescript";

export interface ModelClass {
  new (): Model;
  create(data: any): Promise<Model>;
  update(data: any, options: any): Promise<[number, Model[]]>;
  findOne(options?: FindOptions): Promise<Model | null>;
  findAll(options?: FindOptions): Promise<Model[]>;
  findByPk(id: number | string, options?: FindOptions): Promise<Model | null>;
  destroy(options?: FindOptions): Promise<number>;
}
//  const offset = page * pageSize;
// const limit = pageSize;
async function createModelService({
  ModelClass,
  data,
}: {
  ModelClass: ModelClass;
  data: any;
}) {
  try {
    const model = await ModelClass.create(data);
    return model;
  } catch (error: any) {
    console.error(
      "Error creating model:",
      Array.isArray(error.errors) ? error.errors[0].message : error.message,
    );
    throw new AppError(
      400,
      `Error creating model:, ${
        Array.isArray(error.errors) ? error.errors[0].message : error.message
      }`,
    );
  }
}
async function getModelsService({
  ModelClass,
  findOptions,
  limit,
  offset,
}: {
  ModelClass: ModelClass;
  findOptions?: FindOptions;
  limit?: number;
  offset?: number;
}): Promise<Model[] | null> {
  try {
    // add pagination
    if (!findOptions) findOptions = {};
    if (limit) findOptions.limit = limit;
    if (offset) findOptions.offset = offset;
    const models = await ModelClass.findAll(findOptions);
    return models;
  } catch (error: any) {
    console.error("Error getting all models:", error.message);
    throw new AppError(400, `"Error getting all models:" ${error.message}`);
  }
}
async function getAllModelsByService({
  Model,
  findOptions,
  limit,
  offset,
}: {
  Model: ModelClass;
  findOptions?: FindOptions;
  limit?: number;
  offset?: number;
}): Promise<any | null> {
  try {
    // add pagination
    if (!findOptions) findOptions = {};
    if (limit) findOptions.limit = limit;
    if (offset) findOptions.offset = offset;
    const model = await Model.findAll(findOptions);
    return model;
  } catch (error: any) {
    console.error(
      "Error retrieving model by what you want:",
      Array.isArray(error.errors) ? error.errors[0].message : error.message,
    );
    throw new AppError(
      400,
      `"Error retrieving model by what you want:", ${error.message}`,
    );
  }
}
async function getOneModelByService({
  Model,
  findOptions,
}: {
  Model: ModelClass;
  findOptions?: FindOptions;
}): Promise<any | null> {
  try {
    let myFindOptions = findOptions;
    myFindOptions ? myFindOptions : {};
    // to always get the most recent record
    myFindOptions!.order = [["createdAt", "DESC"]];
    myFindOptions!.limit = 1;
    const model = await Model.findOne(myFindOptions);
    return model;
  } catch (error: any) {
    console.error(
      "Error retrieving model by what you want:",
      Array.isArray(error.errors) ? error.errors[0].message : error.message,
    );
    throw new AppError(
      400,
      `"Error retrieving model by what you want:", ${error.message}`,
    );
  }
}
async function getModelByIdService({
  ModelClass,
  Id,
  findOptions,
}: {
  ModelClass: ModelClass;
  Id: string | number;
  findOptions?: FindOptions;
}): Promise<Model | null> {
  try {
    const model = await ModelClass.findByPk(Id, findOptions);
    return model;
  } catch (error: any) {
    console.error("Error retrieving model by ID:", error.message);
    throw new AppError(
      400,
      `"Error retrieving model by ID"", ${error.message}`,
    );
  }
}
async function getModelByEmailService({
  ModelClass,
  email,
  findOptions,
}: {
  ModelClass: ModelClass;
  email: string;
  findOptions?: FindOptions;
}): Promise<Model | null> {
  try {
    if (!findOptions) findOptions = {};
    findOptions.where = { email };
    const model = await ModelClass.findOne(findOptions);
    return model;
  } catch (error: any) {
    console.error("Error retrieving model by email:", error.message);
    throw new AppError(
      400,
      `"Error retrieving model by email:", ${error.message}`,
    );
  }
}
async function updateModelService({
  ModelClass,
  id,
  updatedData,
  transaction,
}: {
  ModelClass: ModelClass;
  id: string | number;
  updatedData: any;
  transaction?: Transaction;
}): Promise<Model | null> {
  try {
    const [affectedCount, affectedRows] = await ModelClass.update(updatedData, {
      where: { id },
      returning: true,
      individualHooks: true,
      transaction,
    });
    return affectedRows[0];
  } catch (error: any) {
    console.error("Error updating row:", error.message);
    throw new AppError(400, `"Error updating row:", ${error.message}`);
  }
}
async function deleteModelService({
  ModelClass,
  id,
}: {
  ModelClass: ModelClass;
  id: string | number;
}): Promise<number> {
  try {
    const num_of_deleted_rows = await ModelClass.destroy({
      where: {
        id,
      },
    });
    if (num_of_deleted_rows === 0) {
      throw new AppError(404, "There is no record with thi id!");
    }
    return num_of_deleted_rows;
  } catch (error: any) {
    console.error("Error deleting model:", error.message);
    throw new AppError(400, `"Error deleting model:", ${error.message}`);
  }
}

export {
  createModelService,
  updateModelService,
  deleteModelService,
  getAllModelsByService,
  getOneModelByService,
  getModelByEmailService,
  getModelByIdService,
  getModelsService,
};

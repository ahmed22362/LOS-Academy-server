import FeedBack from "../db/models/feedback.model"
import AppError from "../utils/AppError"
import {
  createModelService,
  deleteModelService,
  getModelByIdService,
  getModelsService,
  updateModelService,
} from "./factory.services"

interface createFeedBackBody {
  userId: string
  feedBack: string
}
export async function createFeedBackService({
  body,
}: {
  body: createFeedBackBody
}) {
  try {
    const feedBack = await createModelService({
      ModelClass: FeedBack,
      data: body,
    })
    if (!feedBack) {
      throw new AppError(400, "Can't Create feedBack!")
    }
    return feedBack
  } catch (error: any) {
    throw new AppError(
      400,
      `Error While creating product or feedBack!: ${error.message}`
    )
  }
}
export async function getAllFeedBacksService({
  page,
  limit,
}: {
  page?: number
  limit?: number
}) {
  try {
    const feedBacks = await getModelsService({
      ModelClass: FeedBack,
      page,
      limit,
    })
    if (!feedBacks) {
      throw new AppError(400, `Error while retrieving feedBack`)
    }
    return feedBacks
  } catch (error: any) {
    throw new AppError(400, `Error while retrieving feedBack: ${error.message}`)
  }
}
export async function updateFeedBackService({
  id,
  updatedData,
}: {
  id: number
  updatedData: any
}) {
  return (await updateModelService({
    ModelClass: FeedBack,
    id,
    updatedData,
  })) as FeedBack
}
export async function deleteFeedBackService({ id }: { id: number }) {
  return await deleteModelService({ ModelClass: FeedBack, id: id })
}
export async function getFeedBackService({ id }: { id: number }) {
  return (await getModelByIdService({
    ModelClass: FeedBack,
    Id: id,
  })) as FeedBack
}

import { WhereOptions } from "sequelize";
import { getUserAttr } from "../controller/user.controller";
import FeedBack from "../db/models/feedback.model";
import User from "../db/models/user.model";
import AppError from "../utils/AppError";
import {
  createModelService,
  deleteModelService,
  getModelByIdService,
  getModelsService,
  updateModelService,
} from "./factory.services";

interface createFeedBackBody {
  userId: string;
  feedback: string;
}
export async function createFeedBackService({
  body,
}: {
  body: createFeedBackBody;
}) {
  try {
    const feedback = await createModelService({
      ModelClass: FeedBack,
      data: body,
    });
    if (!feedback) {
      throw new AppError(400, "Can't Create feedback!");
    }
    return feedback;
  } catch (error: any) {
    throw new AppError(
      400,
      `Error While creating product or feedback!: ${error.message}`,
    );
  }
}
export async function getAllFeedBacksService({
  page,
  limit,
  show,
}: {
  page?: number;
  limit?: number;
  show?: boolean;
}) {
  try {
    let where: WhereOptions = {};
    if (show) {
      where.show = show;
    }
    const feedbacks = await getModelsService({
      ModelClass: FeedBack,
      page,
      limit,
      findOptions: {
        include: [{ model: User, attributes: getUserAttr }],
        where,
      },
    });
    if (!feedbacks) {
      throw new AppError(400, `Error while retrieving feedback`);
    }
    return <FeedBack[]>feedbacks;
  } catch (error: any) {
    throw new AppError(
      400,
      `Error while retrieving feedback: ${error.message}`,
    );
  }
}
export async function getAllShownFeedBacksService({
  page,
  limit,
}: {
  page?: number;
  limit?: number;
}) {
  return await getAllFeedBacksService({ page, limit });
}
export async function updateFeedBackService({
  id,
  updatedData,
}: {
  id: number;
  updatedData: any;
}) {
  return (await updateModelService({
    ModelClass: FeedBack,
    id,
    updatedData,
  })) as FeedBack;
}
export async function deleteFeedBackService({ id }: { id: number }) {
  return await deleteModelService({ ModelClass: FeedBack, id: id });
}
export async function getFeedBackService({ id }: { id: number }) {
  return (await getModelByIdService({
    ModelClass: FeedBack,
    Id: id,
    findOptions: {
      include: { model: User, attributes: getUserAttr },
    },
  })) as FeedBack;
}

import Course from "../db/models/course.model";
import AppError from "../utils/AppError";
import {
  createModelService,
  deleteModelService,
  getModelByIdService,
  getModelsService,
  updateModelService,
} from "./factory.services";

export interface createCourseBody {
  title: string;
  description: string;
  stripeProductId?: string;
  details: string;
}
export async function createCourseService({
  body,
}: {
  body: createCourseBody;
}) {
  try {
    const course = await createModelService({ ModelClass: Course, data: body });
    if (!course) {
      throw new AppError(400, "Can't Create course!");
    }
    return course;
  } catch (error: any) {
    throw new AppError(
      400,
      `Error While creating product or course!: ${error.message}`,
    );
  }
}
export async function getAllCoursesService({
  offset,
  limit,
}: {
  offset?: number;
  limit?: number;
}) {
  try {
    const courses = await getModelsService({
      ModelClass: Course,
      offset,
      limit,
    });
    if (!courses) {
      throw new AppError(400, `Error while retrieving course`);
    }
    return courses;
  } catch (error: any) {
    throw new AppError(400, `Error while retrieving course: ${error.message}`);
  }
}
export async function updateCourseService({
  id,
  updatedData,
}: {
  id: string | number;
  updatedData: any;
}) {
  return (await updateModelService({
    ModelClass: Course,
    id,
    updatedData,
  })) as Course;
}
export async function deleteCourseService({ id }: { id: string | number }) {
  return await deleteModelService({ ModelClass: Course, id: id });
}
export async function getCourseService({ id }: { id: string | number }) {
  return (await getModelByIdService({ ModelClass: Course, Id: id })) as Course;
}

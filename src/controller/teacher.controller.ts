import { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import {
  createTeacherService,
  deleteTeacherService,
  getTeacherByIdService,
  getTeacherStudentsService,
  getTeachersService,
  updateTeacherService,
} from "../service/teacher.service";
import AppError from "../utils/AppError";
import Teacher, { ITeacherInput } from "../db/models/teacher.model";
import { decodedToken, login, protect } from "./auth.controller";
import {
  getTeacherAllSessionsService,
  getTeacherLatestTakenSessionService,
  getTeacherOngoingSessionService,
  getTeacherRemainSessionsService,
  getTeacherSessionsStatisticsService,
  getTeacherTakenSessionsService,
  getTeacherUpcomingSessionService,
} from "../service/session.service";
import { verifyToken } from "../utils/jwt";
import { getStripeBalance } from "../service/stripe.service";
import {
  getTeacherAllRescheduleRequestsService,
  getTeacherReceivedRescheduleRequestsService,
  getTeacherRescheduleRequestsService,
} from "../service/rescheduleReq.service";
import { getPaginationParameter } from "./user.controller";
import { estimateRowCountForMultipleTables } from "../utils/getTableRowCount";

export const getTeacherAtt = [
  "id",
  "name",
  "phone",
  "email",
  "role",
  "hour_cost",
  "committed_mins",
  "balance",
  "nationalId",
  "permanent_meeting_url",
];

export const createTeacher = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      name,
      email,
      password,
      phone,
      nationalId,
      role,
      hour_cost,
      permanent_meeting_url,
    } = req.body;
    const body = {
      name,
      email,
      password,
      phone,
      nationalId,
      role,
      hour_cost,
      permanent_meeting_url,
    } as ITeacherInput;
    const newTeacher = await createTeacherService(body);
    if (!newTeacher) {
      return next(new AppError(400, "Can't create new Teacher!"));
    }
    res.status(200).json({ status: "success", data: newTeacher });
  },
);
export const getAllTeachers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { nLimit, offset } = getPaginationParameter(req);
    const teachers = await getTeachersService({
      findOptions: {
        attributes: [...getTeacherAtt, "createdAt"],
        limit: nLimit,
        offset,
      },
    });
    if (!teachers) {
      return next(new AppError(400, "Error getting all teachers!"));
    }
    res.status(200).json({
      status: "success",
      length: teachers.count,
      data: teachers.rows,
    });
  },
);
export const deleteTeacher = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    const deleteState = await deleteTeacherService({ id });
    if (!deleteState) {
      return next(new AppError(400, "Error Deleting Teacher!"));
    }
    res
      .status(200)
      .json({ status: "success", message: "teacher Deleted successfully" });
  },
);
export const updateTeacher = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const {
      name,
      hour_cost,
      email,
      phone,
      nationalId,
      role,
      password,
      balance,
      committed_mins,
      permanent_meeting_url,
    } = req.body;
    const body = {
      name,
      email,
      phone,
      nationalId,
      role,
      hour_cost,
      password,
      balance,
      committed_mins,
      permanent_meeting_url,
    } as ITeacherInput;
    const teacher = await updateTeacherService({
      teacherId: id,
      updatedData: body,
    });
    if (!teacher) {
      return next(
        new AppError(
          404,
          "No Data has changed the teacher is not found or entered data is wrong",
        ),
      );
    }
    res.status(200).json({
      status: "success",
      message: "teacher updated successfully",
      data: teacher,
    });
  },
);
export const updateMeTeacher = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const { name, email, phone, password } = req.body;
    const body = {
      name,
      email,
      phone,
      password,
    } as ITeacherInput;
    const teacher = await updateTeacherService({
      teacherId: id,
      updatedData: body,
    });
    if (!teacher) {
      return next(
        new AppError(
          404,
          "No Data has changed the teacher is not found or entered data is wrong",
        ),
      );
    }
    res.status(200).json({
      status: "success",
      message: "teacher updated successfully",
      data: teacher,
    });
  },
);
export const getTeacher = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const teacher = await getTeacherByIdService({
      id,
      findOptions: {
        attributes: getTeacherAtt,
      },
    });
    if (!teacher) {
      return next(new AppError(404, "Can't find teacher with this id!"));
    }
    res.status(200).json({ status: "success", data: teacher });
  },
);
export const getTeacherRemainSessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teacherId = req.body.teacherId;
    const { nLimit, offset } = getPaginationParameter(req);
    const result = await getTeacherRemainSessionsService({
      teacherId,
      limit: nLimit,
      offset,
    });
    if (!result) {
      return next(new AppError(400, "can't get this teacher Sessions"));
    }
    res
      .status(200)
      .json({ status: "success", length: result.count, data: result.rows });
  },
);
export const getTeacherTakenSessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { nLimit, offset } = getPaginationParameter(req);
    const teacherId = req.body.teacherId;
    const result = await getTeacherTakenSessionsService({
      teacherId,
      limit: nLimit,
      offset,
    });
    if (!result) {
      return next(new AppError(400, "can't get this teacher Sessions"));
    }
    res
      .status(200)
      .json({ status: "success", length: result.count, data: result.rows });
  },
);
export const getTeacherUpcomingSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teacherId = req.body.teacherId;
    const result = await getTeacherUpcomingSessionService({ teacherId });
    if (!result) {
      return next(new AppError(400, "can't get this teacher Sessions"));
    }
    res.status(200).json({
      status: "success",
      length: result.rows.length,
      data: result.rows,
    });
  },
);
export const getTeacherOngoingSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teacherId = req.body.teacherId;
    const result = await getTeacherOngoingSessionService({ teacherId });
    if (!result) {
      return next(new AppError(400, "can't get this teacher Sessions"));
    }
    res
      .status(200)
      .json({ status: "success", length: result.count, data: result.rows });
  },
);
export const getTeacherLatestTakenSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teacherId = req.body.teacherId;
    const result = await getTeacherLatestTakenSessionService({ teacherId });
    if (!result) {
      return next(new AppError(400, "can't get this teacher Sessions"));
    }
    res
      .status(200)
      .json({ status: "success", length: result.count, data: result.rows });
  },
);
export const getTeacherAllSessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teacherId = req.body.teacherId;
    const { offset, nLimit, status } = getPaginationParameter(req);
    const result = await getTeacherAllSessionsService({
      teacherId,
      offset: offset,
      limit: nLimit,
      status: status as string,
    });
    res
      .status(200)
      .json({ status: "success", length: result?.count, data: result?.rows });
  },
);
export const getTeacherAllStudents = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teacherId = req.body.teacherId;
    const { nLimit, offset } = getPaginationParameter(req);
    const result = await getTeacherStudentsService({
      teacherId,
      limit: nLimit,
      offset,
    });
    res
      .status(200)
      .json({ status: "success", length: result.count, data: result.unique });
  },
);
export const checkJWT = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.query.token;
    const decoded = (await verifyToken(token as string)) as decodedToken;

    const teacher = await getTeacherByIdService({ id: decoded.id });
    res.status(200).json({
      status: "success",
      message: "The token is verified!",
      role: teacher.role,
    });
  },
);
export const getAdminBalance = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const balance = await getStripeBalance();
    res.status(200).json({ status: "success", balance: balance.available });
  },
);
export const getUsersAndTeachersCount = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let tableNames = <string>req.query.records || "";
    const result = await estimateRowCountForMultipleTables(
      tableNames.split(","),
    );
    res.status(200).json({ status: "success", data: result });
  },
);
export const getSessionRescheduleRequests = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teacherId = req.body.teacherId;
    const { offset, nLimit, status } = getPaginationParameter(req);
    const rescheduleRequests = await getTeacherRescheduleRequestsService({
      teacherId,
      status: status as any,
      offset,
      limit: nLimit,
    });
    res.status(200).json({
      status: "success",
      length: rescheduleRequests.length,
      data: rescheduleRequests,
    });
  },
);
export const getReceivedSessionRescheduleRequests = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teacherId = req.body.teacherId;
    const { offset, nLimit, status } = getPaginationParameter(req);
    const rescheduleRequests =
      await getTeacherReceivedRescheduleRequestsService({
        teacherId,
        offset,
        limit: nLimit,
        status: status as any,
      });
    res.status(200).json({
      status: "success",
      length: rescheduleRequests.length,
      data: rescheduleRequests,
    });
  },
);
export const getAllSessionRescheduleRequests = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const teacherId = req.body.teacherId;
    const { offset, nLimit, status } = getPaginationParameter(req);
    const rescheduleRequests = await getTeacherAllRescheduleRequestsService({
      teacherId,
      offset,
      limit: nLimit,
      status: status as any,
    });
    res.status(200).json({
      status: "success",
      length: rescheduleRequests.length,
      data: rescheduleRequests,
    });
  },
);
export const getMySessionsStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { teacherId } = req.body;
    const stats = await getTeacherSessionsStatisticsService({ teacherId });
    res.status(200).json({ status: "success", data: stats });
  },
);
export const loginTeacher = login(Teacher);

export const protectTeacher = protect(Teacher);

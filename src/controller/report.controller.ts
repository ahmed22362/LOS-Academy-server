import { NextFunction, Response, Request } from 'express';
import { Op } from 'sequelize';
import catchAsync from '../utils/catchAsync';
import {
  getOneSessionWithSessionInfoOnlyService,
  teacherOwnThisSession,
  updateSessionService,
} from '../service/session.service';
import AppError from '../utils/AppError';
import {
  createReportService,
  deleteReportService,
  getAllReportsService,
  getReportService,
  getUserOrTeacherReportsService,
  updateReportService,
} from '../service/report.service';
import { SessionStatus, SessionType } from '../db/models/session.model';
import User from '../db/models/user.model';
import { getPaginationParameter, getUserAttr } from './user.controller';
import Teacher from '../db/models/teacher.model';
import { getTeacherAtt } from './teacher.controller';
import logger from '../utils/logger';
import { updateTeacherBalance } from '../service/teacher.service';
import { sequelize } from '../db/sequelize';
import { emitReportAddedForUser } from '../connect/socket';
import {
  getBaileysWhatsAppStatus,
  sendWhatsAppGroupPDF,
} from '../connect/baileys';
import { generateReportPDF } from '../utils/generateReportPDF';
import { formatReportWhatsAppCaption } from '../utils/reportWhatsAppCaption';

const formatSessionReportDate = (date: Date): string =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: process.env.WHATSAPP_REPORT_TIME_ZONE || 'America/New_York',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));

export const createReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId, reportCourses, comment, teacherId, grade, title } =
      req.body;
    const exist = await teacherOwnThisSession({ teacherId, sessionId });
    if (!exist) {
      next(
        new AppError(
          401,
          'Teacher does not own this session to write report for it',
        ),
      );
    }
    const session = await getOneSessionWithSessionInfoOnlyService({
      sessionId,
    });
    // if (session.status !== SessionStatus.TAKEN) {
    //   return next(new AppError(400, "can't add report to a non taken session"));
    // }
    // if (session.hasReport) {
    //   return next(
    //     new AppError(
    //       400,
    //       "Session already has report you can't add two reports for the same session!"
    //     )
    //   );
    // }
    const transaction = await sequelize.transaction();
    try {
      const report = await createReportService({
        body: {
          reportCourses,
          comment,
          grade,
          teacherId,
          userId: session.sessionInfo?.userId!,
          title,
        },
        transaction,
      });
      if (session.type === SessionType.PAID) {
        const teacherHourCost = session.sessionInfo?.teacher?.hour_cost || 0;
        const minsCost = teacherHourCost / 60;
        let teacherBalanceAmount = minsCost * session.sessionDuration;
        teacherBalanceAmount =
          Math.round((teacherBalanceAmount + Number.EPSILON) * 100) / 100;
        await updateTeacherBalance({
          teacherId: teacherId!,
          amount: teacherBalanceAmount,
          transaction,
        });
      }
      await updateSessionService({
        sessionId,
        updatedData: { hasReport: true },
        transaction,
      });
      await transaction.commit();
      emitReportAddedForUser(session.sessionInfo?.userId!, report);

      // Send report via WhatsApp (async, don't block response)
      (async () => {
        try {
          if (getBaileysWhatsAppStatus()) {
            // Fetch full report with user and teacher details
            const fullReport = await getReportService({
              reportId: report.id,
              findOptions: {
                include: [
                  {
                    model: User,
                    as: 'user',
                    attributes: getUserAttr,
                  },
                  {
                    model: Teacher,
                    as: 'teacher',
                    attributes: getTeacherAtt,
                  },
                ],
              },
            });

            const user = fullReport.user;
            const groupJid =
              user?.whatsAppGroupJid || fullReport.teacher?.whatsAppGroupJid;
            if (user && groupJid) {
              // Generate PDF
              const pdfBuffer = await generateReportPDF({
                id: fullReport.id,
                title: fullReport.title,
                grade: fullReport.grade,
                comment: fullReport.comment,
                reportCourses: fullReport.reportCourses,
                createdAt: fullReport.createdAt,
                user: {
                  name: user.name,
                  email: user.email,
                },
                teacher: {
                  name: fullReport.teacher?.name || 'Unknown',
                },
              });

              const success = await sendWhatsAppGroupPDF({
                jid: groupJid,
                pdfBuffer,
                fileName: `Session_Report_${report.id}.pdf`,
                caption: formatReportWhatsAppCaption(
                  `Session report: ${title || 'Quran session'} — ${formatSessionReportDate(session.sessionDate)}`,
                ),
              });

              if (success) {
                logger.info(
                  `Report ${report.id} sent to WhatsApp group ${groupJid}`,
                );
              } else {
                logger.warn(
                  `Failed to send report ${report.id} via WhatsApp group ${groupJid}`,
                );
              }
            } else {
              logger.warn(`Report ${report.id} has no WhatsApp group JID`);
            }
          } else {
            logger.warn(
              'Baileys WhatsApp client is not ready, skipping report sending',
            );
          }
        } catch (error: any) {
          logger.error(`Error sending report via WhatsApp: ${error.message}`);
        }
      })();

      res.status(201).json({
        status: 'success',
        message: 'report created successfully',
        data: report,
      });
    } catch (error: any) {
      await transaction.rollback();
      logger.error(`Error while creating report ${error}`);
      return next(new AppError(400, `Error creating report ${error.message}`));
    }
  },
);
export const updateReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { reportCourses, comment, teacherId, grade } = req.body;
    const reportId = req.params.id;
    const report = await getReportService({
      reportId: +reportId,
      findOptions: { where: { teacherId } },
    });
    if (!report) {
      return next(
        new AppError(403, 'there are no report with this id and teacher!'),
      );
    }
    const updatedReport = await updateReportService({
      reportId: report.id,
      updateBody: {
        reportCourses,
        comment,
        grade,
      },
    });
    res.status(200).json({
      status: 'success',
      message: 'report updated successfully',
      data: updatedReport,
    });
  },
);
export const getReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const reportId = req.params.id;
    const report = await getReportService({ reportId: +reportId });
    res.status(200).json({ status: 'success', data: report });
  },
);
export const deleteReport = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const reportId = req.params.id;
    const report = await getReportService({
      reportId: +reportId,
    });

    await deleteReportService({ reportId: +reportId });
    res
      .status(200)
      .json({ status: 'success', message: 'report deleted successfully' });
  },
);
export const getAllReports = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { offset, nLimit, orderBy, order } = getPaginationParameter(req);
    const userSearch = req.query.search as string | undefined;

    // Build order clause
    let orderClause: any = [['createdAt', 'DESC']]; // Default ordering
    if (orderBy && order) {
      orderClause = [[orderBy, order]];
    } else if (order) {
      orderClause = [['createdAt', order]];
    } else if (orderBy) {
      orderClause = [[orderBy, 'DESC']];
    }

    let userWhere: any = {};
    let teacherWhere: any = {};
    if (userSearch) {
      userWhere[Op.or] = [
        { name: { [Op.iLike]: `%${userSearch}%` } },
        { email: { [Op.iLike]: `%${userSearch}%` } },
      ];
    }

    const reports = await getAllReportsService({
      findOptions: {
        include: [
          {
            model: User,
            attributes: getUserAttr,
            where: userWhere,
            required: userSearch ? true : false,
          },
          {
            model: Teacher,
            attributes: getTeacherAtt,
            where: teacherWhere,
            required: userSearch ? true : false,
          },
        ],
        limit: nLimit,
        offset: offset,
        order: orderClause,
      },
    });
    res.status(200).json({
      status: 'success',
      length: reports.count,
      data: reports.rows,
    });
  },
);
export const getUserReports = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { offset, nLimit, orderBy, order } = getPaginationParameter(req);
    const userId = req.query.userId || req.body.userId;

    // Build order clause
    let orderClause: any = [['createdAt', 'DESC']]; // Default ordering
    if (orderBy && order) {
      orderClause = [[orderBy, order]];
    } else if (order) {
      orderClause = [['createdAt', order]];
    } else if (orderBy) {
      orderClause = [[orderBy, 'DESC']];
    }

    const reports = await getUserOrTeacherReportsService({
      userId,
      offset,
      limit: nLimit,
      order: orderClause,
    });
    res
      .status(200)
      .json({ status: 'success', length: reports.length, data: reports });
  },
);
export const getTeacherReports = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { offset, nLimit, orderBy, order } = getPaginationParameter(req);
    const teacherId = req.query.teacherId || req.body.teacherId;

    // Build order clause
    let orderClause: any = [['createdAt', 'DESC']]; // Default ordering
    if (orderBy && order) {
      orderClause = [[orderBy, order]];
    } else if (order) {
      orderClause = [['createdAt', order]];
    } else if (orderBy) {
      orderClause = [[orderBy, 'DESC']];
    }

    const reports = await getUserOrTeacherReportsService({
      teacherId,
      offset: offset,
      limit: nLimit,
      order: orderClause,
    });
    res
      .status(200)
      .json({ status: 'success', length: reports.length, data: reports });
  },
);

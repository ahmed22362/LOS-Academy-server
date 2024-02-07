import Mail from "../connect/sendMail";
import {
  emitSessionFinishedForUser,
  emitSessionOngoingForUser,
} from "../connect/socket";
import { RescheduleRequestStatus } from "../db/models/rescheduleReq.model";
import { scheduledJobStatus } from "../db/models/scheduleJob.model";
import { SessionStatus } from "../db/models/session.model";
import { RoleType } from "../db/models/teacher.model";
import {
  getOneRescheduleRequestService,
  updateRescheduleRequestService,
} from "../service/rescheduleReq.service";
import {
  deleteJobService,
  updateJobService,
} from "../service/scheduleJob.service";
import {
  generateMeetingLinkAndUpdateSession,
  getOneSessionDetailsService,
  getOneSessionWithSessionInfoOnlyService,
  handleSessionFinishedService,
} from "../service/session.service";
import logger from "./logger";

interface JobCallback {
  (...args: any[]): Promise<void>;
}
export const callbacksNames = {
  SESSION_REMINDER_MAIL: "Reminder Mail",
  SESSION_STARTED_MAIL: "Session Started Mail",
  UPDATE_SESSION_TO_ONGOING: "Session Is Ongoing",
  UPDATE_SESSION_TO_FINISHED: "Session Is Finished",
  UPDATE_SESSION_RESCHEDULE_STATUS: "Reschedule Request Updating",
};

const jobCallbacks = new Map<string, JobCallback>();

const sessionReminderEmail: JobCallback = async function ({
  sessionDate,
  studentName,
  studentEmail,
  teacherName,
  teacherEmail,
  jobId,
}: {
  sessionDate: Date;
  sessionId: number;
  studentName: string;
  studentEmail: string;
  teacherName: string;
  teacherEmail: string;
  jobId: number;
}) {
  try {
    await new Mail(studentEmail, studentName).sendSessionReminderMail({
      sessionDate:
        sessionDate instanceof Date
          ? sessionDate.toUTCString()
          : new Date(sessionDate).toUTCString(),
    });
    await new Mail(teacherEmail, teacherName).sendSessionReminderMail({
      sessionDate:
        sessionDate instanceof Date
          ? sessionDate.toUTCString()
          : new Date(sessionDate).toUTCString(),
    });
    logger.info("One time session reminder mail executed!");
    await deleteJobService({ id: jobId });
  } catch (error: any) {
    await deleteJobService({ id: jobId });
    logger.error(`Can't Send session reminder mail: ${error}`);
  }
};
const sessionStartedEmail: JobCallback = async function ({
  sessionId,
  jobId,
}: {
  sessionId: number;
  jobId: number;
}) {
  const session = await getOneSessionDetailsService({ sessionId });
  try {
    const sessionDate = session.sessionDate;
    if (!session.studentAttended) {
      await new Mail(
        session.SessionInfo.user!.email,
        session.SessionInfo.user!.name,
      ).sendSessionStartReminderForUser({
        sessionDate:
          sessionDate instanceof Date
            ? sessionDate.toUTCString()
            : new Date(sessionDate).toUTCString(),
      });
      await new Mail(
        process.env.ADMIN_EMAIL as string,
        "Admin",
      ).sendSessionStartReminderForAdmin({
        userName: session.SessionInfo.user!.name,
        teacherName: session.SessionInfo.teacher!.name,
        whoMiss: RoleType.USER,
        sessionDate:
          sessionDate instanceof Date
            ? sessionDate.toUTCString()
            : new Date(sessionDate).toUTCString(),
      });
    }
    if (!session.teacherAttended) {
      await new Mail(
        session.SessionInfo.teacher!.email,
        session.SessionInfo.teacher!.name,
      ).sendSessionStartReminderForUser({
        sessionDate:
          sessionDate instanceof Date
            ? sessionDate.toUTCString()
            : new Date(sessionDate).toUTCString(),
      });
      await new Mail(
        process.env.ADMIN_EMAIL as string,
        "Admin",
      ).sendSessionStartReminderForAdmin({
        userName: session.SessionInfo.user!.name,
        teacherName: session.SessionInfo.teacher!.name,
        whoMiss: RoleType.TEACHER,
        sessionDate:
          sessionDate instanceof Date
            ? sessionDate.toUTCString()
            : new Date(sessionDate).toUTCString(),
      });
    }
    logger.info("One time session started reminder mail executed!");
    await deleteJobService({ id: jobId });
  } catch (error: any) {
    await deleteJobService({ id: jobId });
    logger.error(`Can't send session started reminder mail: ${error}`);
  }
};
const sessionUpdateToOngoing: JobCallback = async function ({
  sessionId,
  jobId,
}: {
  sessionId: number;
  jobId: number;
}) {
  try {
    const updatedSession = await generateMeetingLinkAndUpdateSession({
      sessionId,
      status: SessionStatus.ONGOING,
    });
    logger.info("One time session updated to ongoing executed!");
    // one for user and one for teacher!
    const session = await getOneSessionWithSessionInfoOnlyService({
      sessionId: updatedSession.id,
    });
    emitSessionOngoingForUser(session.SessionInfo.userId!, session);
    emitSessionOngoingForUser(session.SessionInfo.teacherId!, session);
    await deleteJobService({ id: jobId });
  } catch (error: any) {
    await updateJobService({
      id: jobId,
      updatedData: { status: scheduledJobStatus.FAILED },
    });
    logger.error(
      `Can't update Session to be ongoing or generating the link try manually: ${error}`,
    );
  }
};
const sessionUpdateToFinished: JobCallback = async function ({
  sessionId,
  jobId,
}: {
  sessionId: number;
  jobId: number;
}) {
  try {
    const data = await handleSessionFinishedService({
      sessionId,
    });
    emitSessionFinishedForUser(
      data!.session.SessionInfo.userId!,
      data!.updatedSession,
    );
    emitSessionFinishedForUser(
      data!.session.SessionInfo.teacherId!,
      data!.updatedSession,
    );
    await deleteJobService({ id: jobId });
    logger.info(`One time session Finished with status executed!`);
  } catch (error: any) {
    await updateJobService({
      id: jobId,
      updatedData: { status: scheduledJobStatus.FAILED },
    });
    logger.error(`Can't update the fished session's status: ${error}`);
  }
};
// handel no response requests
const rescheduleRequestUpdate: JobCallback = async function ({
  rescheduleRequestId,
  jobId,
}: {
  rescheduleRequestId: number;
  jobId: number;
}) {
  const request = await getOneRescheduleRequestService({
    id: rescheduleRequestId,
  });
  if (request.status === RescheduleRequestStatus.PENDING) {
    await updateRescheduleRequestService({
      requestId: rescheduleRequestId,
      status: RescheduleRequestStatus.NO_RESPONSE,
    });
    logger.info("One time reschedule Request updated to no response executed!");
  }

  await deleteJobService({ id: jobId });
  logger.info(
    "One time reschedule Request job executed already responded request!",
  );
};
jobCallbacks.set(callbacksNames.SESSION_REMINDER_MAIL, sessionReminderEmail);
jobCallbacks.set(callbacksNames.SESSION_STARTED_MAIL, sessionStartedEmail);
jobCallbacks.set(
  callbacksNames.UPDATE_SESSION_TO_ONGOING,
  sessionUpdateToOngoing,
);
jobCallbacks.set(
  callbacksNames.UPDATE_SESSION_TO_FINISHED,
  sessionUpdateToFinished,
);
jobCallbacks.set(
  callbacksNames.UPDATE_SESSION_RESCHEDULE_STATUS,
  rescheduleRequestUpdate,
);

export default jobCallbacks;

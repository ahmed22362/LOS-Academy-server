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
  sessionId,
  jobId,
}: {
  sessionId: number;
  jobId: number;
}) {
  try {
    const session = await getOneSessionDetailsService({ sessionId });
    await new Mail(
      session.sessionInfo?.user?.email!,
      session.sessionInfo?.user?.name!,
    ).sendSessionReminderMail({
      sessionDate: new Date(session.sessionDate).toUTCString(),
    });
    await new Mail(
      session.sessionInfo?.teacher?.email!,
      session.sessionInfo?.teacher?.name!,
    ).sendSessionReminderMail({
      sessionDate: new Date(session.sessionDate).toUTCString(),
    });
    logger.info("One time session reminder mail executed!");
    await deleteJobService({ id: jobId });
  } catch (error: any) {
    await deleteJobService({ id: jobId });
    logger.error(
      `Can't Send session reminder mail: ${error} , session: ${sessionId}`,
    );
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
        session.sessionInfo?.user!.email!,
        session.sessionInfo?.user!.name!,
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
        userName: session.sessionInfo?.user!.name!,
        teacherName: session.sessionInfo?.teacher!.name!,
        whoMiss: RoleType.USER,
        sessionDate:
          sessionDate instanceof Date
            ? sessionDate.toUTCString()
            : new Date(sessionDate).toUTCString(),
      });
    }
    if (!session.teacherAttended) {
      await new Mail(
        session.sessionInfo?.teacher!.email!,
        session.sessionInfo?.teacher!.name!,
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
        userName: session.sessionInfo?.user!.name!,
        teacherName: session.sessionInfo?.teacher!.name!,
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
    logger.error(
      `Can't send session started reminder mail: ${error} , sessionId: ${sessionId}`,
    );
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
    logger.info(`One time session ${sessionId} updated to ongoing executed!`);
    // one for user and one for teacher!
    const session = await getOneSessionWithSessionInfoOnlyService({
      sessionId: updatedSession.id,
    });
    emitSessionOngoingForUser(session.sessionInfo?.userId!, session);
    emitSessionOngoingForUser(session.sessionInfo?.teacherId!, session);
    await deleteJobService({ id: jobId });
  } catch (error: any) {
    await deleteJobService({ id: jobId });
    logger.error(
      `Can't update Session to be ongoing or generating the link try manually: ${error}, sessionId: ${sessionId}`,
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
      data!.session.sessionInfo?.userId!,
      data!.updatedSession,
    );
    emitSessionFinishedForUser(
      data!.session.sessionInfo?.teacherId!,
      data!.updatedSession,
    );
    await deleteJobService({ id: jobId });
    logger.info(`One time session Finished with status executed!`);
  } catch (error: any) {
    await deleteJobService({ id: jobId });
    logger.error(
      `Can't update the fished session's ${sessionId} status: ${error}`,
    );
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

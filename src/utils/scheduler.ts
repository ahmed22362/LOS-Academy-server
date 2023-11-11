import schedule from "node-schedule"
import Mail from "../connect/sendMail"
import { getUserByIdService } from "../service/user.service"
import { getTeacherByIdService } from "../service/teacher.service"
import logger from "./logger"

export function scheduleVerifyMailJob({
  to,
  name,
  link,
}: {
  to: string
  name: string
  link: string
}) {
  const mail = new Mail(to, name)

  logger.info("in send verify mail schedule!")
  const date = new Date(new Date().getTime() + 20000)
  const job = schedule.scheduleJob(date, async () => {
    await mail.sendVerifyMail({ link })
    logger.info("One time send verify mail executed!")
    // Delete job
    job.cancel()
    logger.info("Job deleted")
  })
}
export function scheduleSuccessSubscriptionMailJob({
  to,
  name,
  subscriptionAmount,
  subscriptionCycle,
  subscriptionTitle,
}: {
  to: string
  name: string
  subscriptionTitle: string
  subscriptionAmount: number
  subscriptionCycle: string
}) {
  const mail = new Mail(to, name)
  logger.info("in send subscription success mail schedule!")
  const date = new Date(new Date().getTime() + 10000)
  const job = schedule.scheduleJob(date, async () => {
    await mail.sendSubscriptionCreateMail({
      subscriptionAmount,
      subscriptionCycle,
      subscriptionTitle,
    })
    logger.info("One time send subscription success mail executed!")
    // Delete job
    job.cancel()
    logger.info("Job deleted")
  })
}
export function scheduleSubscriptionCanceledMailJob({
  to,
  name,
}: {
  to: string
  name: string
}) {
  const mail = new Mail(to, name)
  logger.info("in send subscription cancelled mail schedule!")
  const date = new Date(new Date().getTime() + 10000)
  const job = schedule.scheduleJob(date, async () => {
    await mail.sendSubscriptionCanceledMail()
    logger.info("One time send subscription cancelled executed!")
    // Delete job
    job.cancel()
    logger.info("Job deleted")
  })
}
export function scheduleSessionPlacedMailJob({
  userEmail,
  userName,
  teacherEmail,
  teacherName,
  sessionDate,
}: {
  userEmail: string
  userName: string
  teacherEmail: string
  teacherName: string
  sessionDate: Date
}) {
  logger.info("in send session placed mail schedule!")
  const date = new Date(new Date().getTime() + 10000)
  const job = schedule.scheduleJob("mail", date, async () => {
    await new Mail(userEmail, userName).sendSessionPlacesMail({
      sessionDate: sessionDate.toUTCString(),
    })
    await new Mail(teacherEmail, teacherName).sendSessionPlacesMail({
      sessionDate: sessionDate.toUTCString(),
    })
    logger.info("One time session placed mail executed!")
    // Delete job
    job.cancel()
    logger.info("Job deleted")
  })
}
export function scheduleSessionReminderMailJob({
  userId,
  teacherId,
  sessionDate,
  sessionTitle,
}: {
  userId: string
  teacherId: string
  sessionDate: Date
  sessionTitle: string
}) {
  logger.info("in session reminder mail schedule!")
  const job = schedule.scheduleJob(sessionTitle, sessionDate, async () => {
    const user = await getUserByIdService({ userId })
    const teacher = await getTeacherByIdService({ id: teacherId })
    await new Mail(user.email, user.name).sendSessionReminderMail({
      sessionDate: sessionDate.toUTCString(),
    })
    await new Mail(teacher.email, teacher.name).sendSessionReminderMail({
      sessionDate: sessionDate.toUTCString(),
    })
    logger.info("One time session reminder mail executed!")
    // Delete job
    job.cancel()
    logger.info("Job deleted")
  })
}

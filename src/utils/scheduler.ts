import schedule from "node-schedule"
import Mail from "../connect/sendMail"

export function scheduleWelcomeMailJob({
  date,
  to,
  name,
}: {
  date: Date
  to: string
  name: string
}) {
  const mail = new Mail(to, name)
  console.log("in send mail schedule!")
  const job = schedule.scheduleJob(date, async () => {
    await mail.sendWelcome()
    console.log("One time job executed!")
    // Delete job
    job.cancel()
    console.log("Job deleted")
  })
}
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
  console.log("in send verify mail schedule!")
  const date = new Date(new Date().getTime() + 20000)
  const job = schedule.scheduleJob(date, async () => {
    await mail.sendVerifyMail({ link })
    console.log("One time job executed!")
    // Delete job
    job.cancel()
    console.log("Job deleted")
  })
}

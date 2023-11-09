import schedule from "node-schedule"
// import Mail from "../connect/sendMail"

export function createSendMailJob({
  date,
  to,
  name,
}: {
  date: Date
  to: string
  name: string
}) {
  //   const mail = new Mail(to, name)
  const job = schedule.scheduleJob(new Date(), async () => {
    // await mail.sendWelcome()
    console.log("One time job executed!")

    // Delete job
    job.cancel()
    console.log("Job deleted")
  })
}

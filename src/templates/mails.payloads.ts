import { RescheduleRequestStatus } from "../db/models/rescheduleReq.model"

export const forgetPasswordPayload = ({
  name,
  link,
}: {
  name: string
  link: string
}) => {
  const header = "Password Reset Request"
  const title = "Password Reset Request"
  const paragraph = `Hey ${name},
    <p>This is the password reset OTP you requested from LOS Academy. Use to reset your LOS Academy account password.</p>`
  const footer = `Have additional questions or need direct assistance? 
    <p>reach out to our support team at <a href="mailto:info@codegate.info">info@codegate.info</a>.</p>`
  const mailAdds = `  <tr>
    <td align="left" bgcolor="#ffffff">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" bgcolor="#ffffff" style="padding: 12px;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" bgcolor="#0B193E" style="border-radius: 6px;">
                  <a href="${link}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 6px;">Reset Password!</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
  return { header, title, paragraph, footer, mailAdds }
}
export const subscriptionCreatePayload = ({
  name,
  subscriptionTitle,
  subscriptionAmount,
  subscriptionCycle,
}: {
  name: string
  subscriptionTitle: string
  subscriptionAmount: number
  subscriptionCycle: string
}) => {
  const header = "Your subscription is now active!"
  const paragraph = `Dear ${name},Thank you for subscribing to one of our plan. You are now part of our community!`
  const footer = `Stay tuned for exciting updates and exclusive offers.`
  const mailAdds = `    
  <table style="width: 100%; border-collapse: collapse; margin-top: 20px">
  <tr style="background-color: #0B193E; color: #ffffff">
    <th style="padding: 15px; text-align: left">
      Subscription Information
    </th>
  </tr>
  <tr>
    <td style="padding: 15px; text-align: left">
      <strong>Subscription Title:</strong> ${subscriptionTitle}
    </td>
  </tr>
  <tr>
    <td style="padding: 15px; text-align: left">
      <strong>Amount:</strong> ${subscriptionAmount}
    </td>
  </tr>
  <tr>
    <td style="padding: 15px; text-align: left">
      <strong>Payment Cycle:</strong> ${subscriptionCycle}
    </td>
  </tr>
</table>`
  const title = "Subscription Creation"
  return { header, title, paragraph, footer, mailAdds }
}
export const subscriptionCanceledPayload = ({ name }: { name: string }) => {
  const title = "Subscription Cancellation Confirmation"
  const header = "Your Subscription Has Been Cancelled!"
  const paragraph = `Hi ${name},
  <p>We wanted to confirm that your subscription has been successfully canceled. </P>
  <p>We appreciate the time you've spent with us and value your feedback.</P>
  If you have any suggestions for improvement or if there's anything we can do to assist you further, please don't hesitate to reach out to our support team at <a href="mailto:info@codegate.info">info@codegate.info</a>.
  <p>Thank you for being a part of our community.</p>`
  return { title, header, paragraph }
}
export const sessionPlacedPayload = ({
  name,
  sessionDate,
}: {
  name: string
  sessionDate: string
}) => {
  const title = "Session Scheduled Confirmation"
  const header = "Session Scheduled Confirmation!"
  const paragraph = `Hi ${name},
  <p>We're excited to inform you that your sessions have been successfully scheduled. Here are the details of FIRST session:</p>
  <p>You can see the remain session in your profile dashboard!</p>`
  const mailAdds = `    
  <table style="width: 100%; border-collapse: collapse; margin-top: 20px">
  <tr style="background-color: #0B193E; color: #ffffff">
    <th style="padding: 15px; text-align: left">
      Session Information
    </th>
  </tr>
  <tr>
    <td style="padding: 15px; text-align: left">
      <strong>SessionDate:</strong> ${sessionDate}
    </td>
  </tr>
</table>
`
  const footer = `<p>We hope you have a productive and enjoyable session. If you have any questions or need further assistance, feel free to reach out to our support team at <a href="mailto:info@codegate.info">info@codegate.info</a>.</p>`
  return { title, header, paragraph, mailAdds, footer }
}
export const sessionReschedulePayload = ({
  senderName,
  receiverName,
  sessionOldDate,
  newDateStartRange,
  newDateEndRange,
}: {
  senderName: string
  receiverName: string
  sessionOldDate: string
  newDateStartRange: string
  newDateEndRange: string
}) => {
  const title = "Session Reschedule Request"
  const header = "Session Reschedule Request!"
  const paragraph = `Hello ${receiverName},
  <p>We hope this message finds you well. A user has requested to reschedule their session with you. Here are the details:</p>
  <div style="margin-top: 20px; text-align: left;">
  <p><strong>User:</strong> ${senderName}</p>
  <p><strong>Current Session Date and Time:</strong> ${sessionOldDate}</p>
  <p><strong>Proposed Rescheduled Date and Time:</strong> from ${newDateStartRange} to ${newDateEndRange}</p>
</div>
  `
  const footer = `If you have any questions or need further assistance, feel free to reach out to our support team at <a href="mailto:info@codegate.info">info@codegate.info</a>.</p>`
  return { title, header, paragraph, footer }
}
export const SessionStartReminderForUserPayload = ({
  userName,
  sessionDate,
}: {
  userName: string
  sessionDate: string
}) => {
  const title = "Your session has started!"
  const header = "Your session has started!"
  const paragraph = `Dear ${userName},
  <p>This is a reminder that your scheduled learning session started 3 minutes ago at ${sessionDate}.</p>
  <p>The tutor is waiting for you to join the online session. Please login to the platform immediately and click the "Join Session" button on your dashboard to join the video call.</p>
  `
  const footer = `If you have any questions or need further assistance, feel free to reach out to our support team at <a href="mailto:info@codegate.info">info@codegate.info</a>.</p>`
  return { title, header, paragraph, footer }
}
export const SessionStartReminderForAdminPayload = ({
  userName,
  teacherName,
  sessionDate,
}: {
  userName: string
  teacherName: string
  sessionDate: string
}) => {
  const title = "Student missed session start!"
  const header = "Student missed session start!"
  const paragraph = `Hello Admin,
  <p>This is an automated notification from LOS Academy to inform you that ${userName} has not joined the scheduled learning session with 
  ${teacherName} after 3 minutes from the session start time of ${sessionDate}.</p>
  <p>The tutor has been waiting in the virtual classroom but the student has failed to log in and connect as expected at the scheduled time.

  Please follow up with the student directly to understand why they did not join and assist with rescheduling or cancelling if needed.</p>
  `
  const footer = `If you have any questions or need further assistance, feel free to reach out to our support team at <a href="mailto:info@codegate.info">info@codegate.info</a>.</p>`
  return { title, header, paragraph, footer }
}
export const sessionRescheduleStatusPayload = ({
  status,
  receiverName,
  senderName,
  sessionOldDate,
  newDateStartRange,
  newDateEndRange,
  newDate,
}: {
  status: string
  receiverName: string
  senderName: string
  sessionOldDate: string
  newDateStartRange: string
  newDateEndRange: string
  newDate: string
}) => {
  const title = "Session Reschedule Status Update"
  const header = "Session Reschedule Status Updated!"
  let paragraph = `Hello ${receiverName},
  <p>${senderName} has updated the status of your session reschedule request. Here are the details:</p>
  <div style="margin-top: 20px; text-align: left;">
  <p><strong>Original Session Date and Time:</strong> ${sessionOldDate}</p>
  <p><strong>Proposed Rescheduled Date and Time:</strong>from ${newDateStartRange} to ${newDateEndRange}</p>
  <p><strong>Status:</strong> ${status}</p>
</div>
  `
  let mailAdds
  if (status === RescheduleRequestStatus.APPROVED) {
    paragraph += `<p>And the <strong>new Date</strong> of the session is ${newDate}</p> `
  }
  const footer = `If you have any questions or need further assistance, feel free to reach out to our support team at <a href="mailto:info@codegate.info">info@codegate.info</a>.</p>`
  return { title, header, paragraph, footer, mailAdds }
}
export const sessionReminderPayload = ({
  name,
  sessionDate,
}: {
  name: string
  sessionDate: string
}) => {
  const title = "Session Reminder"
  const header = "Your session is in 30 minutes!"
  const paragraph = `Hello ${name},
  <pThis is a quick reminder that your at LOS Academy is scheduled to begin in 30 minutes at ${sessionDate}.</p>
  <p>Please make sure you are ready to join the session on time.</p>
  <p>If you need to reschedule this session, please Open you profile dashboard then ask for reschedule and we can find an alternate time that works for you.</p>`
  const footer = `<p>We hope you have a productive and enjoyable session. If you have any questions or need further assistance, feel free to reach out to our support team at <a href="mailto:info@codegate.info">info@codegate.info</a>.</p>`
  return { title, header, paragraph, footer }
}
export const payoutRequestPayload = ({
  name,
  teacherName,
  amount,
}: {
  name: string
  teacherName: string
  amount: number
}) => {
  const title = "Teacher Payout Request"
  const header = " You have a pending payout request!"
  const paragraph = `Hello ${name},
  <p>${teacherName} has submitted a payout request through our system.

  <p>Here are the details of the request:</p>
  <p><strong>Requested Amount:</strong> ${amount}</p>`
  const footer = `<p>If you have any questions or need further assistance, feel free to reach out to our support team at <a href="mailto:info@codegate.info">info@codegate.info</a>.</p>`
  return { title, header, paragraph, footer }
}
export const payoutRequestStatusPayload = ({
  name,
  status,
}: {
  name: string
  status: string
}) => {
  const title = "Payout Request Status Updated!"
  const header = `You pending payout request status become ${status}!`
  const paragraph = `Hello ${name},
  <p>We wanted to inform you that the status of your payout request has been updated.`
  const footer = `<p>If you have any questions or need further assistance, feel free to reach out to our support team at <a href="mailto:info@codegate.info">info@codegate.info</a>.</p>`
  return { title, header, paragraph, footer }
}

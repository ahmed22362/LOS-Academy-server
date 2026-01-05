import nodemailer from "nodemailer";
import { Resend } from "resend";
import dotenv from "dotenv";
import generateVerifyEmail from "../templates/verifyEmailTemplate";
import generateGenericEmail from "../templates/genericEmailTemplate";
import {
  SessionStartReminderForAdminPayload,
  SessionStartReminderForUserPayload,
  forgetPasswordPayload,
  newStudentSignupAdminPayload,
  payoutPayload,
  payoutRequestStatusPayload,
  sessionPlacedPayload,
  sessionReminderPayload,
  sessionReschedulePayload,
  sessionRescheduleStatusPayload,
  subscriptionCanceledPayload,
  subscriptionCreatePayload,
} from "../templates/mails.payloads";
import { RoleType } from "../db/models/teacher.model";
dotenv.config();

const resend = new Resend(process.env.RESEND_API as string);

export interface MailInterface {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html: string;
}
interface ITemplate {
  html: string;
  text: string;
}

class Mail {
  to: string;
  name: string;
  constructor(to: string, name: string) {
    this.to = to;
    this.name = name;
  }
  newTransporter() {
    return nodemailer.createTransport({
      host: process.env.MAIL_HOST as any,
      port: process.env.MAIL_PORT as any,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }
  async send(template: ITemplate, subject: string) {
    let from = "Support <info@codegate.info>";
    if (process.env.NODE_ENV?.trim() === "production") {
      from = "Support <info@los-academy.net>";
    }
    return await resend.emails.send({
      from,
      to: this.to,
      subject: subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendVerifyMail({ link }: { link: string }) {
    try {
      console.log("Preparing to send verification email to:", this.to);
      const verifyMailTemplate = generateVerifyEmail({ name: this.name, link });
      console.log("Verification email template generated");
      const info = await this.send(verifyMailTemplate, "Email Confirmation!");
      console.log("Verification email sent successfully:", info); 
      if (process.env.NODE_ENV === "development") {
        console.log("Message sent: %s", info.data);
      }
      return info;
    } catch (error: any) {
      console.error("Error sending verification email:", error.message);
      console.error("Full error:", error);
      throw error;
    }
  }
  async sendForgetPassword({ link }: { link: string }) {
    const { header, title, paragraph, footer, mailAdds } =
      forgetPasswordPayload({
        name: this.name,
        link,
      });
    const forgetTemplate = generateGenericEmail({
      header,
      paragraph,
      footer,
      mailAdds,
      title,
    });
    let info = await this.send(forgetTemplate, "Password Reset Request!");
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.data);
    }
  }
  async sendNewStudentSignupNotification({
    studentName,
    studentEmail,
    studentPhone,
    studentAge,
    studentGender,
    adminEmail,
  }: {
    studentName: string;
    studentEmail: string;
    studentPhone: string;
    studentAge: number;
    studentGender: string;
    adminEmail: string;
  }) {
    const { header, title, paragraph, footer, mailAdds } =
      newStudentSignupAdminPayload({
        studentName,
        studentEmail,
        studentPhone,
        studentAge,
        studentGender,
      });
    const adminNotificationTemplate = generateGenericEmail({
      header,
      paragraph,
      footer,
      mailAdds,
      title,
    });
    // Temporarily override the recipient
    const originalTo = this.to;
    this.to = adminEmail;
    const info = await this.send(
      adminNotificationTemplate,
      "New Student Registration - LOS Academy"
    );
    this.to = originalTo; // Restore original recipient
    if (process.env.NODE_ENV === "development") {
      console.log("Admin notification sent: %s", info.data);
    }
  }
  async sendSubscriptionCreateMail({
    subscriptionTitle,
    subscriptionAmount,
    subscriptionCycle,
  }: {
    subscriptionTitle: string;
    subscriptionAmount: number;
    subscriptionCycle: string;
  }) {
    const { header, title, paragraph, footer, mailAdds } =
      subscriptionCreatePayload({
        name: this.name,
        subscriptionTitle,
        subscriptionAmount,
        subscriptionCycle,
      });
    const activeSubscriptionTemplate = generateGenericEmail({
      title,
      header,
      footer,
      mailAdds,
      paragraph,
    });
    const info = await this.send(
      activeSubscriptionTemplate,
      "Subscription Successful!!",
    );
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.data);
    }
  }
  async sendSubscriptionCanceledMail() {
    const { title, paragraph, header } = subscriptionCanceledPayload({
      name: this.name,
    });
    const subscriptionCanceledTemplate = generateGenericEmail({
      title,
      paragraph,
      header,
    });
    const info = await this.send(
      subscriptionCanceledTemplate,
      "Subscription Cancellation Confirmation",
    );
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.data);
    }
  }
  async sendSessionPlacesMail({ sessionDate }: { sessionDate: string }) {
    const { title, paragraph, header, footer, mailAdds } = sessionPlacedPayload(
      {
        name: this.name,
        sessionDate,
      },
    );
    const sessionPlacedTemplate = generateGenericEmail({
      title,
      paragraph,
      header,
      footer,
      mailAdds,
    });
    const info = await this.send(
      sessionPlacedTemplate,
      "Session Placed Confirmation",
    );
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.data);
    }
  }
  async sendSessionReminderMail({ sessionDate }: { sessionDate: string }) {
    const { title, paragraph, header, footer } = sessionReminderPayload({
      name: this.name,
      sessionDate,
    });
    const sessionReminderTemplate = generateGenericEmail({
      title,
      paragraph,
      header,
      footer,
    });
    const info = await this.send(
      sessionReminderTemplate,
      "Your session is in 40 minutes!",
    );
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.data);
    }
  }
  async sendSessionRescheduleRequestMail({
    receiverName,
    sessionOldDate,
    newDatesOptions,
  }: {
    receiverName: string;
    sessionOldDate: Date;
    newDatesOptions: Date[];
  }) {
    let dates = Array.isArray(newDatesOptions)
      ? newDatesOptions
      : [newDatesOptions];
    const { title, paragraph, header, footer } = sessionReschedulePayload({
      senderName: this.name,
      receiverName,
      newDatesOptions: dates.map((date) =>
        date.toLocaleString("en-GB", { timeZone: "UTC" }),
      ),
      sessionOldDate: sessionOldDate.toUTCString(),
    });
    const sessionRescheduleTemplate = generateGenericEmail({
      title,
      paragraph,
      header,
      footer,
    });
    const info = await this.send(
      sessionRescheduleTemplate,
      "Session Reschedule Request!",
    );
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.data);
    }
  }
  async sendSessionRescheduleRequestUpdateMail({
    senderName,
    sessionOldDate,
    newDatesOptions,
    sessionNewDate,
    status,
  }: {
    senderName: string;
    sessionOldDate: Date;
    newDatesOptions: Date[];
    sessionNewDate: Date;
    status: string;
  }) {
    let dates = Array.isArray(newDatesOptions)
      ? newDatesOptions
      : [newDatesOptions];
    const { title, paragraph, header, footer, mailAdds } =
      sessionRescheduleStatusPayload({
        senderName,
        receiverName: this.name,
        newDatesOptions: dates.map((date) =>
          date.toLocaleString("en-GB", {
            timeZone: "UTC",
          }),
        ),
        newDate: sessionNewDate.toLocaleString("en-GB", { timeZone: "UTC" }),
        sessionOldDate: sessionOldDate.toLocaleString("en-GB", {
          timeZone: "UTC",
        }),
        status,
      });
    const sessionRescheduleTemplate = generateGenericEmail({
      title,
      paragraph,
      header,
      footer,
      mailAdds,
    });
    const info = await this.send(
      sessionRescheduleTemplate,
      "Session Reschedule Status Update!",
    );
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.data);
    }
  }
  async sendSessionStartReminderForUser({
    sessionDate,
  }: {
    sessionDate: string;
  }) {
    const { title, paragraph, header, footer } =
      SessionStartReminderForUserPayload({
        userName: this.name,
        sessionDate,
      });
    const sessionStartReminderTemplate = generateGenericEmail({
      title,
      paragraph,
      header,
      footer,
    });
    const info = await this.send(
      sessionStartReminderTemplate,
      "Your session has started!",
    );
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.data);
    }
  }
  async sendSessionStartReminderForAdmin({
    userName,
    teacherName,
    sessionDate,
    whoMiss,
  }: {
    userName: string;
    teacherName: string;
    sessionDate: string;
    whoMiss: RoleType;
  }) {
    let who, missWith;
    if (whoMiss === RoleType.TEACHER) {
      who = teacherName;
      missWith = userName;
    } else if (whoMiss === RoleType.USER) {
      who = userName;
      missWith = teacherName;
    }
    const { title, paragraph, header, footer } =
      SessionStartReminderForAdminPayload({
        whoMiss: who as string,
        missWith: missWith as string,
        sessionDate,
      });
    const sessionStartReminderAdminTemplate = generateGenericEmail({
      title,
      paragraph,
      header,
      footer,
    });
    const info = await this.send(
      sessionStartReminderAdminTemplate,
      "Student missed session start!",
    );
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.data);
    }
  }
  async sendPayoutMail({
    teacherName,
    amount,
  }: {
    teacherName: string;
    amount: number;
  }) {
    const { title, paragraph, header, footer } = payoutPayload({
      teacherName,
      amount,
    });
    const payoutTemplate = generateGenericEmail({
      title,
      paragraph,
      header,
      footer,
    });
    const info = await this.send(payoutTemplate, "Teacher Payout!");
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.data);
    }
  }
  async sendPayoutRequestStatusUpdatedMail({ status }: { status: string }) {
    const { title, paragraph, header, footer } = payoutRequestStatusPayload({
      name: this.name,
      status,
    });
    const payoutRequestTemplate = generateGenericEmail({
      title,
      paragraph,
      header,
      footer,
    });
    const info = await this.send(
      payoutRequestTemplate,
      "Payout Request Status Updated!",
    );
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.data);
    }
  }

  async sendQRCode(qrCodeData: string) {
    const qrHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>WhatsApp QR Code</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #25D366; text-align: center;">WhatsApp Authentication Required</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Hello ${this.name},
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              The WhatsApp client needs to be authenticated. Please scan the QR code below using WhatsApp on your phone:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData)}" 
                   alt="WhatsApp QR Code" 
                   style="max-width: 300px; border: 2px solid #25D366; border-radius: 10px;" />
            </div>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <h4 style="color: #555; margin-top: 0;">How to scan:</h4>
              <ol style="color: #666; line-height: 1.8;">
                <li>Open WhatsApp on your phone</li>
                <li>Tap Menu or Settings</li>
                <li>Tap Linked Devices</li>
                <li>Tap Link a Device</li>
                <li>Point your phone at this screen to capture the QR code</li>
              </ol>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              This is an automated message from LOS Academy System
            </p>
          </div>
        </body>
      </html>
    `;

    const info = await this.send(
      { html: qrHtml, text: 'WhatsApp QR Code - Please scan to authenticate' },
      "WhatsApp Authentication - QR Code"
    );
    
    if (process.env.NODE_ENV === "development") {
      console.log("QR Code email sent: %s", info.data);
    }
    return info;
  }
}

export default Mail;

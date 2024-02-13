import nodemailer from "nodemailer";
import dotenv from "dotenv";
import generateVerifyEmail from "../templates/verifyEmailTemplate";
import generateGenericEmail from "../templates/genericEmailTemplate";
import {
  SessionStartReminderForAdminPayload,
  SessionStartReminderForUserPayload,
  forgetPasswordPayload,
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
    const mailOptions = {
      from: "Support <info@codegate.info>", // sender address
      to: this.to, // list of receivers
      subject: subject, // Subject line
      text: template.text || "", // plain text body
      html: template.html, // html body
    };
    return await this.newTransporter().sendMail(mailOptions);
  }
  async sendVerifyMail({ link }: { link: string }) {
    const verifyMailTemplate = generateVerifyEmail({ name: this.name, link });
    const info = await this.send(verifyMailTemplate, "Email Confirmation!");
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
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
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
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
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
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
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
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
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
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
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
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
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
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
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
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
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
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
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
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
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
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
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  }
}

export default Mail;

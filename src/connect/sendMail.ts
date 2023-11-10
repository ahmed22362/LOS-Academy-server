import nodemailer from "nodemailer"
import dotenv from "dotenv"
import generateResetPasswordTemplate from "../templates/resetPasswordTemplate"
import generateWelcomeTemplate from "../templates/welcomeTemplate"
import generateConfirmOrder from "../templates/confirmOrderTemplate"
import generateVerifyEmail from "../templates/verifyEmailTamplate"
dotenv.config()

export interface MailInterface {
  from?: string
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  text?: string
  html: string
}
interface ITemplate {
  html: string
  text: string
}

class Mail {
  to: string
  name: string
  url?: string
  constructor(to: string, name: string, url?: string) {
    this.to = to
    this.name = name
    this.url = url
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
    })
  }

  async send(template: ITemplate, subject: string) {
    const mailOptions = {
      from: "Support <info@codegate.info>", // sender address
      to: this.to, // list of receivers
      subject: subject, // Subject line
      text: template.text || "", // plain text body
      html: template.html, // html body
    }
    return await this.newTransporter().sendMail(mailOptions)
  }

  async sendWelcome() {
    const welcomeTemplate = generateWelcomeTemplate(this.name)
    let info = await this.send(welcomeTemplate, "Welcome To LOS Academy")
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.messageId)
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))
    }
  }
  async sendForgetPassword() {
    const forgetTemplate = generateResetPasswordTemplate(
      this.url as string,
      this.name
    )
    let info = await this.send(forgetTemplate, "Password Reset Request!")
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.messageId)
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))
    }
  }
  async sendConfirmOrder(order: any, total: number) {
    const confirmOrderTemplate = generateConfirmOrder(order, total, this.name)
    const info = await this.send(confirmOrderTemplate, "Order details!")
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.messageId)
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))
    }
  }
  async sendVerifyMail({ link }: { link: string }) {
    const verifyMailTemplate = generateVerifyEmail({ name: this.name, link })
    const info = await this.send(verifyMailTemplate, "Email Confirmation!")
    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.messageId)
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))
    }
  }
}

export default Mail

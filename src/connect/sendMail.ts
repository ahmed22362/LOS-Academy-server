import nodemailer from "nodemailer"
import dotenv from "dotenv"
import generateResetPasswordTemplate from "../templates/resetPasswordTemplate"
import generateWelcomeTemplate from "../templates/welcomeTemplate"
import generateConfirmOrder from "../templates/confirmOrderTemplate"
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
    if (process.env.NODE_ENV === "developmt") {
      console.log("in development and try to send mail")
      return nodemailer.createTransport({
        host: "smtp.resend.com",
        port: 465,
        secure: false,
        tls: {
          rejectUnauthorized: false,
        },
        auth: {
          user: "resend",
          pass: `re_KpjAX6QM_C7SfmdHQLt224YHtv9ZaF3PE`,
        },
      })
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })
      // return nodemailer.createTransport({
      //   host: process.env.MAIL_HOST as any,
      //   port: process.env.MAIL_PORT as any,
      //   secure: true,
      //   auth: {
      //     user: process.env.MAIL_USER,
      //     pass: process.env.MAIL_PASSWORD,
      //   },
      // })
    } else {
      return nodemailer.createTransport({
        host: process.env.MAIL_HOST as any,
        port: process.env.MAIL_PORT as any,
        // secure: true,
        tls: {
          ciphers: "SSLv3",
        },
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      })
    }
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
}

let testTransporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "6c17daa23163c3",
    pass: "e879316559a500",
  },
})

export default Mail

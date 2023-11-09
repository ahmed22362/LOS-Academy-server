import { Resend } from "resend"
import dotenv from "dotenv"
dotenv.config()
const resend = new Resend(process.env.RESEND_API)

resend.emails.send({
  from: "onboarding@resend.dev",
  to: "ahmedhamada496@gmail.com",
  subject: "Hello World",
  html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
})

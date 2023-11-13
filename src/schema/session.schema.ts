import { z } from "zod"
const sessionId = z.string({
  required_error: "please provide sessionid in the boy!",
})

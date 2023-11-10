import { Router } from "express"
import {
  loginUserSchema,
  signupUserSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  updateMyPasswordSchema,
} from "../schema/user.schema"
import {
  login,
  checkToken,
  signup,
  forgetPassword,
  resetPassword,
  updatePassword,
  googleOauthController,
  verifyMail,
  resendMailConfirmation,
} from "../controller/auth.controller"
import validate from "../middleware/validate"
import { protect } from "../controller/auth.controller"
import { loginUser, protectUser } from "../controller/user.controller"

const authRouter = Router()

authRouter.get("/oauth/google/callback", googleOauthController)
authRouter.post("/signup", validate(signupUserSchema), signup)
authRouter.post("/login", validate(loginUserSchema), loginUser)
authRouter.post(
  "/forgetPassword",
  validate(forgetPasswordSchema),
  forgetPassword
)
authRouter.route("/resetPassword/:token").get((req, res) => {
  const { token } = req.params
  res.render("resetPassword", { token })
})
authRouter.post("/resetPassword", validate(resetPasswordSchema), resetPassword)
authRouter
  .route("/updateMyPassword")
  .patch(protectUser, validate(updateMyPasswordSchema), updatePassword)
authRouter.get("/checkSign", protectUser, checkToken)
authRouter.get("/verifyEmail", verifyMail)
authRouter.get("/resendMailConfirmation", resendMailConfirmation)

export default authRouter

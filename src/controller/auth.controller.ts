import { Response, NextFunction, CookieOptions, Request } from "express"
import catchAsync from "../utils/catchAsync"
import User, { IUserInput } from "../db/models/user.model"
import { LoginUserSchemaBody } from "../schema/user.schema"
import AppError from "../utils/AppError"
import { singJWTToken, verifyToken } from "../utils/jwt"
import Mail from "../connect/sendMail"
import crypto from "crypto"
import dotenv from "dotenv"
import {
  UserResponse,
  createUserService,
  getUserByService,
  updateUserService,
} from "../service/user.service"
import {
  ModelClass,
  getModelByEmailService,
  getModelByIdService,
} from "../service/factory.services"
import Teacher from "../db/models/teacher.model"
import { createStripeCustomer } from "../service/stripe.service"
import { scheduleVerifyMailJob } from "../utils/scheduler"
dotenv.config()

export interface IRequestWithUser extends Request {
  user?: User
  teacher?: Teacher
}
export interface decodedToken {
  id: string
  iat: number
  exp: number
}

const createSendToken = ({
  user,
  statusCode,
  res,
  redirect,
}: {
  user: User | Teacher
  statusCode?: number
  res: Response
  redirect?: string
}) => {
  const token: string = singJWTToken({ id: user.id })
  const millSecToDay: number = 24 * 60 * 60 * 1000

  // const cookieExpire = config.get<number>("JWT_COOKIES_EXPIRES")
  const cookieExpire = process.env.JWT_COOKIES_EXPIRES as any
  let cookieOptions: CookieOptions = {
    expires: new Date(Date.now() + cookieExpire * millSecToDay),
    httpOnly: true,
    secure: false,
  }

  // local host is not https so for test purpose we will make this if statement
  if (process.env.NODE_ENV?.trim() === "production") {
    cookieOptions.secure = true
  }

  res.cookie("token", token, cookieOptions)
  if (statusCode) {
    return res.status(statusCode).json({ status: "success", token, data: user })
  } else if (redirect) {
    return res.redirect(redirect)
  }
  res.status(200).json({ status: "success", token, data: user })
}

export const signup = catchAsync(async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { name, email, password, phone, age, gender }: IUserInput = req.body
  const stripeCustomer = await createStripeCustomer({
    email,
    name: name,
    phone,
  })
  const userData = {
    name,
    email,
    password,
    phone,
    age,
    gender,
    customerId: stripeCustomer.id,
  } as IUserInput

  const newUser = await createUserService({ userData })
  if (!newUser) {
    return next(new AppError(400, "Cant signup now try again later"))
  }
  const userRes: UserResponse = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    age: newUser.age,
    gender: newUser.gender,
    remainSessions: newUser.remainSessions,
    availableFreeSession: newUser.availableFreeSession,
    verified: newUser.verified,
    sessionPlaced: newUser.sessionPlaced,
  }
  await createAndSendConfirmMail(newUser, req)
  res.status(201).json({
    status: "success",
    message: "Confirmation Mail sent, Now confirm your mail so you can log in!",
    data: userRes,
  })
})

export const checkToken = (req: Request, res: Response, next: NextFunction) => {
  res.send(singJWTToken({ test: "test" }))
}

export const login = (Model: ModelClass) =>
  catchAsync(async function (req: Request, res: Response, next: NextFunction) {
    // Get the data first
    const { email, password }: LoginUserSchemaBody = req.body
    // Find if the user exist
    const model = (await getModelByEmailService({
      ModelClass: Model,
      email,
    })) as Teacher | User
    if (!model || !(await model.correctPassword(password, model.password))) {
      return next(new AppError(401, "There email or password is not correct!"))
    }
    if (model instanceof User && !model.verified) {
      return next(
        new AppError(
          403,
          "Can't log in before you verify you email if you miss the first mail you can always resend it!"
        )
      )
    }
    if (model instanceof User) {
      const userRes: UserResponse = {
        id: model.id,
        name: model.name,
        email: model.email,
        age: model.age,
        gender: model.gender,
        remainSessions: model.remainSessions,
        availableFreeSession: model.availableFreeSession,
        verified: model.verified,
        sessionPlaced: model.sessionPlaced,
      }
      return createSendToken({ user: userRes as User, statusCode: 202, res })
    }
    createSendToken({ user: model, statusCode: 202, res })
  })

export const protect = (Model: ModelClass) =>
  catchAsync(
    async (req: IRequestWithUser, res: Response, next: NextFunction) => {
      if (!Model) {
        return next(new AppError(404, "Please provide model to search with!"))
      }
      // 1) Getting token and check if it's there
      let token: string | undefined
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        token = req.headers.authorization.split(" ")[1]
      } else if (req.cookies.token !== undefined) {
        token = req.cookies.token
      }
      if (!token || token === "null") {
        return next(
          new AppError(
            401,
            "You are not logged in! Please log in to get access."
          )
        )
      }
      // 2) Verification token
      const decoded = await verifyToken(token)
      // 3) Check if user still exists
      const currentUser = (await getModelByIdService({
        ModelClass: Model,
        Id: decoded.id,
      })) as User | Teacher
      if (!currentUser) {
        return next(
          new AppError(401, "The user belonging to this token does not exist.")
        )
      }

      // 4) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
          new AppError(
            401,
            "User recently changed password! Please log in again."
          )
        )
      }
      // GRANT ACCESS TO PROTECTED ROUTE
      if (currentUser instanceof User) {
        req.user = currentUser
      } else if (currentUser instanceof Teacher) {
        req.teacher = currentUser
      } else {
        return next(new AppError(400, "Can't identify the object identity!"))
      }
      next()
    }
  )

export const restrictTo = (...roles: string[]) => {
  return (req: IRequestWithUser, res: Response, next: NextFunction) => {
    roles.flat(Infinity)
    if (!roles.includes(req.teacher!.role)) {
      return next(new AppError(403, "You don't have permission to do this!"))
    }
    next()
  }
}

export const forgetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body
    const user = await getUserByService({ findOptions: { where: { email } } })
    if (!user) {
      return next(new AppError(404, "Can't find user with this email!"))
    }
    const resetToken: string = user.createPasswordResetCode()
    await user.save() // saved the hashed token in the user document
    //send the mail
    const resetURL: string = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/user/auth/resetPassword/${resetToken}`
    try {
      const mail = new Mail(user.email, `${user.name}`)
      await mail.sendForgetPassword({ link: resetURL })
      res.status(200).json({ status: "success", message: "token sent to mail" })
    } catch (error: any) {
      await updateUserService({
        userId: user.id,
        updatedData: {
          passwordResetCode: null,
          passwordResetExpire: null,
        },
      })
      return next(
        new AppError(
          400,
          "There are error while sending the mail. Try again later!: " +
            error.message
        )
      )
    }
  }
)

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token, password, passwordConfirmation } = req.body
    const hashedToken: string = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")
    const user = await getUserByService({
      findOptions: { where: { hashedToken } },
    })
    if (!user) {
      return res.render("resetPasswordError", { error: "Link is not valid!" })
    }
    if (user.passwordResetCode !== hashedToken) {
      return res.render("resetPasswordError", { error: "Link is not valid!" })
    }
    // Validate the new password and confirmation
    if (password !== passwordConfirmation) {
      return next(new AppError(400, "Passwords do not match!"))
    }
    if (new Date() > (user.passwordResetExpire as Date)) {
      return res.render("errorPage", {
        message: "Looks like the this link has expired Request a new link",
      })
    }
    await updateUserService({
      userId: user.id,
      updatedData: {
        password,
        passwordResetCode: null,
        passwordResetExpire: null,
      },
    })
    // createSendToken(user, 200, res)
    // Set a success message
    // Redirect to the login page
    res.render("resetPasswordSuccess")
  }
)
export const updatePassword = catchAsync(
  async (req: IRequestWithUser, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword } = req.body
    const userId = req.user!.id
    const user = await getUserByService({
      findOptions: { where: { id: userId } },
    })
    if (!user) {
      return next(
        new AppError(
          400,
          "some thing wend wrong while getting the user in update password"
        )
      )
    }
    if (!(await user.correctPassword(currentPassword, user.password))) {
      return next(new AppError(400, "Your current password is wrong"))
    }
    // 3) If so, update password
    const updatedUser = (await updateUserService({
      userId: req.user!.id,
      updatedData: {
        password: newPassword,
      },
    })) as User
    // User.findByIdAndUpdate will NOT work as intended!
    // 4) Log user in, send JWT
    createSendToken({ user: updatedUser, statusCode: 200, res })
  }
)
export const verifyMail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.query
    if (!token) {
      return res.render("errorPage", { message: "some thing wrong happened" })
    }
    const hashedToken: string = crypto
      .createHash("sha256")
      .update(token as string)
      .digest("hex")
    const user = await User.findOne({
      where: { OTPToken: hashedToken },
    })
    if (!user) {
      return res.render("errorPage", {
        message: "Looks like the link is invalid",
      })
    }
    if (new Date() > (user!.OTPexpireAt as Date)) {
      return res.render("errorPage", {
        message: "Looks like the link has expired! request a new one",
      })
    }
    await updateUserService({
      userId: user!.id,
      updatedData: {
        verified: true,
        OTPToken: null,
        OTPexpireAt: null,
      },
    })
    res.render("successPage", {
      successMessage: "Your Email confirmed successfully!",
      redirectLink: "/",
      to: "Home",
    })
  }
)
export const resendMailConfirmation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const email = req.query.email
    if (!email) {
      return next(
        new AppError(
          400,
          "Please provide mail to resend token to confirm the mail"
        )
      )
    }
    const user = await getUserByService({ findOptions: { where: { email } } })
    if (!user) {
      return next(
        new AppError(404, "Can't find user registered with this email!")
      )
    }
    if (user.verified) {
      return next(
        new AppError(400, "User already verified his mail user can log in now!")
      )
    }
    await createAndSendConfirmMail(user, req)
    res
      .status(200)
      .json({ status: "success", message: "email send successfully" })
  }
)
const createAndSendConfirmMail = async (user: User, req: Request) => {
  const code = await user.createVerifyEmailCode()
  const link: string = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/user/auth/verifyEmail?token=${code}`
  scheduleVerifyMailJob({ to: user.email, name: user.name, link })
}

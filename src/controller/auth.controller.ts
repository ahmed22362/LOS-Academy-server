import { Response, NextFunction, CookieOptions, Request } from "express"
import catchAsync from "../utils/catchAsync"
import User, { IUserInput } from "../db/models/user.model"
import { LoginUserSchemaBody } from "../schema/user.schema"
import AppError from "../utils/AppError"
import { singJWTToken, verifyToken } from "../utils/jwt"
import Mail from "../connect/sendMail"
import crypto from "crypto"
import dotenv from "dotenv"
import logger from "../utils/logger"
import {
  getGoogleOAuthTokens,
  getGoogleUser,
} from "../service/googleOauth.service"
import {
  createUserService,
  getUserByResetTokenService,
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
    // domain: ".cubuild.net",
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
  const { name, email, password, phone, age }: IUserInput = req.body

  const userData = {
    name,
    email,
    password,
    phone,
    age,
  } as IUserInput
  const newUser = await createUserService({ userData })
  if (!newUser) {
    return next(new AppError(400, "Cant signup now try again later"))
  }
  const stripeCustomer = await createStripeCustomer({
    email,
    name: name,
    phone,
  })
  newUser.customerId = stripeCustomer.id
  await newUser.save()
  createSendToken({ user: newUser, statusCode: 201, res })
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

    createSendToken({ user: model, statusCode: 202, res })
  })

export const protect = (Model: ModelClass, inputToken?: string) =>
  catchAsync(
    async (req: IRequestWithUser, res: Response, next: NextFunction) => {
      if (!Model) {
        return next(new AppError(404, "Please provide model to search with!"))
      }
      console.log("in protect", Model)
      // 1) Getting token and check if it's there
      let token: string | undefined
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        token = req.headers.authorization.split(" ")[1]
      } else if (req.cookies.token !== undefined) {
        token = req.cookies.token
      } else if (inputToken) {
        token = inputToken
      }
      if (!token) {
        return next(
          new AppError(
            401,
            "You are not logged in! Please log in to get access."
          )
        )
      }
      // 2) Verification token
      const decoded = (await verifyToken(token)) as decodedToken
      console.log(decoded)
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
        throw new AppError(400, "Can't identify the object identity!")
      }
      console.log("done protect")
      next()
    }
  )

export const restrictTo = (...roles: string[]) => {
  return (req: IRequestWithUser, res: Response, next: NextFunction) => {
    roles.flat(Infinity)
    console.log(req.teacher!.role)
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
      const mail = new Mail(user.email, `${user.name}`, resetURL)
      await mail.sendForgetPassword()
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

export const googleOauthController = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // get the code from qs
    const code = req.query.code as string
    // get the id and access token with the code
    try {
      const { id_token, access_token } = await getGoogleOAuthTokens({
        code,
      })
      // get user with tokens
      const googleUser = await getGoogleUser({ id_token, access_token })
      //jwt.decode(id_token);
      // upsert the user
      if (!googleUser.verified_email) {
        throw new AppError(403, "Google Account is not verified!")
      }
      const [user, created] = await User.findOrCreate({
        where: { email: googleUser.email },
        defaults: {
          email: googleUser.email,
          name: googleUser.name,
        } as User,
      })
      logger.info({ user })
      // create an access token
      createSendToken({ user, redirect: "https://cubuild.net/", res })
    } catch (error: any) {
      logger.error(error, "Failed to authorized Google user!")
      return res.render("errorPage", { message: error.message })
    }
  }
)

import { FindOptions, Transaction } from "sequelize"
import User, { Gender, IUserInput } from "../db/models/user.model"
import AppError from "../utils/AppError"
import {
  getSubscriptionBy,
  getSubscriptionByUserId,
} from "./subscription.service"
import Plan from "../db/models/plan.model"
import { SubscriptionStatus } from "../db/models/subscription.model"
import { updateModelService } from "./factory.services"
const { Op } = require("sequelize")

export interface UserResponse {
  id: string
  name: string
  email: string
  age: number
  phone?: string
  gender: Gender
  availableFreeSession: number
  remainSessions: number
  verified: boolean
  sessionPlaced: boolean
}

async function createUserService({
  userData,
}: {
  userData: IUserInput
}): Promise<User | null> {
  try {
    const newUser = await User.create(userData as any)
    return newUser
  } catch (error: any) {
    console.error("Error creating user:", error.message)
    throw error
  }
}
async function getUsersService({
  findOptions,
}: {
  findOptions?: FindOptions
}): Promise<User[] | null> {
  try {
    const users = await User.findAll(findOptions)
    return users
  } catch (error: any) {
    console.error("Error getting all users:", error.message)
    return null
  }
}
async function getUserByIdService({
  userId,
  findOptions,
}: {
  userId: string
  findOptions?: FindOptions
}): Promise<User> {
  try {
    const user = await User.findByPk(userId, findOptions)
    if (!user) {
      throw new AppError(404, "Can't find user with this id!")
    }
    return user
  } catch (error: any) {
    console.error("Error retrieving user by ID:", error.message)
    throw new AppError(400, `"Error retrieving user by ID:", ${error.message}`)
  }
}
async function getUserByService({
  findOptions,
}: {
  findOptions?: FindOptions
}): Promise<User> {
  try {
    const user = await User.findOne(findOptions)
    if (!user) {
      throw new AppError(404, "Can't find user")
    }
    return user
  } catch (error: any) {
    console.error("Error retrieving user by what you want:", error.message)
    throw new AppError(
      400,
      `Error retrieving user by what you want:", ${error.message}`
    )
  }
}
async function getUserByResetTokenService({
  hashedToken,
}: {
  hashedToken: string
}): Promise<User | null> {
  try {
    const user = await User.findOne({
      where: {
        passwordResetCode: hashedToken,
        passwordResetExpire: {
          [Op.gt]: new Date(),
        },
      },
    })
    return user
  } catch (error: any) {
    console.error("Error retrieving user by email:", error.message)
    return null
  }
}
async function updateUserService({
  userId,
  updatedData,
  transaction,
}: {
  userId: string
  updatedData: object
  transaction?: Transaction
}): Promise<User> {
  const user = await updateModelService({
    ModelClass: User,
    id: userId,
    updatedData,
  })
  return user as User
}
async function updateUserRemainSessionService({
  userId,
  amountOfSessions,
  transaction,
}: {
  userId: string
  amountOfSessions: number
  transaction?: Transaction
}) {
  const user = await getUserByIdService({ userId })
  // to indicate if the user take placed his session or not so he can't placed again
  // make it false again because he payed so he has the apportunety to place session again
  user.sessionPlaced = false
  await user.save()
  return await user.increment(
    { remainSessions: amountOfSessions },
    { transaction }
  )
}
async function deleteUserService({
  userId,
}: {
  userId: string
}): Promise<boolean> {
  try {
    const user = await User.findByPk(userId)
    if (!user) {
      return false
    }

    // Delete the user from the database
    await user.destroy()

    return true
  } catch (error: any) {
    console.error("Error deleting user:", error.message)
    return false
  }
}
async function getUserSubscriptionPlan({
  userId,
  status,
}: {
  userId: string
  status?: SubscriptionStatus
}) {
  const where: any = { userId }
  if (status) {
    where.status = status
  }
  const userSubscription = getSubscriptionBy({
    findOptions: { where, include: Plan, order: [["createAt", "DESC"]] },
  })
  return userSubscription
}
async function checkUserSubscription({ userId }: { userId: string }) {
  const subscription = await getSubscriptionByUserId({ userId })
  if (!subscription) {
    throw new AppError(
      400,
      "user must subscribe to plan first to request paid session!"
    )
  }
  return subscription
}
export async function sessionPerWeekEqualDates({
  userId,
  sessionDatesLength,
}: {
  userId: string
  sessionDatesLength: number
}) {
  const subscribe = await getUserSubscriptionPlan({ userId })
  if (subscribe.plan.sessionsPerWeek !== sessionDatesLength) {
    throw new AppError(
      400,
      `must provide date for all sessions per week the sessions per week are: ${subscribe.plan.sessionsPerWeek} `
    )
  }
}
export async function checkIfUserPlacedHisSessionBefore({
  userId,
}: {
  userId: string
}) {
  const user = await getUserByIdService({ userId })
  if (user.sessionPlaced) {
    throw new AppError(
      403,
      `Can't place user session user already placed his session for this month!
       Wait for the next month or contact your admin`
    )
  }
}
export {
  createUserService,
  updateUserService,
  deleteUserService,
  getUserByService,
  getUserByIdService,
  getUsersService,
  getUserByResetTokenService,
  getUserSubscriptionPlan,
  checkUserSubscription,
  updateUserRemainSessionService,
}

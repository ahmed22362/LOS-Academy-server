import { FindOptions, Transaction } from "sequelize"
import User, { Gender, IUserInput } from "../db/models/user.model"
import AppError from "../utils/AppError"
import {
  getSubscriptionBy,
  getSubscriptionByUserId,
} from "./subscription.service"
import Plan from "../db/models/plan.model"
import { SubscriptionStatus } from "../db/models/subscription.model"
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
}

async function createUserService({
  userData,
}: {
  userData: IUserInput
}): Promise<User | null> {
  try {
    const newUser = await User.create(userData)
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
}: {
  userId: string
  updatedData: Partial<User>
}): Promise<User | null> {
  try {
    const [affectedCount, affectedRows] = await User.update(updatedData, {
      where: { id: userId },
      returning: true,
      individualHooks: true,
    })
    if (affectedRows.length === 0) {
      // No user found to update
      return null
    }
    if (affectedCount > 1) {
      throw new AppError(400, "update user update more than one user !")
    }
    return affectedRows[0]
  } catch (error: any) {
    console.error("Error updating user:", error.message)
    throw new AppError(400, error.message)
  }
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

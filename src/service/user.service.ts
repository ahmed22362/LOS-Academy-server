import { FindOptions } from "sequelize"
import User, { IUserInput } from "../db/models/user.model"
import AppError from "../utils/AppError"
import { getSubscriptionByUserId } from "./subscription.service"
import Plan from "../db/models/plan.model"
const { Op } = require("sequelize")

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
}): Promise<User | null> {
  try {
    console.log(userId, findOptions)
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
}): Promise<User | null> {
  try {
    const user = await User.findOne(findOptions)
    return user
  } catch (error: any) {
    console.error("Error retrieving user by what you want:", error.message)
    return null
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

async function getUserSubscriptionPlan({ userId }: { userId: string }) {
  const userSubscription = getSubscriptionByUserId({
    userId,
    findOptions: { where: { userId, status: "active" }, include: Plan },
  })
  return userSubscription
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
}

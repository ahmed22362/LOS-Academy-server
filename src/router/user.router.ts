import { Router } from "express"
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUser,
  protectUser,
  setUserIdToParams,
  updateUser,
} from "../controller/user.controller"
import authRouter from "./auth.router"

const userRouter = Router()

userRouter.use("/auth", authRouter)

userRouter.route("/").post(createUser).get(getAllUsers)
userRouter.get("/me", protectUser, setUserIdToParams, getUser)
userRouter.route("/:id").patch(updateUser).delete(deleteUser).get(getUser)

export default userRouter

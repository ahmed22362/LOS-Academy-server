import { NextFunction, Response, Request } from "express"
import B2Client from "../utils/b2client"
import catchAsync from "../utils/catchAsync"
import AppError from "../utils/AppError"
import dotenv from "dotenv"
dotenv.config()

function sanitizeFilename(name: string) {
  name = name.replace(/ /g, "_")

  name = name.replace(/-/g, "_")

  name = name.replace(/[^\w.-]+/g, "")

  return name
}

export const uploadToB2 = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let files = req.files as Express.Multer.File[]
    const keyId = process.env.B2_KEY_ID || ""
    const applicationKey = process.env.B2_APPLICATION_KEY || ""
    const b2client = new B2Client(keyId, applicationKey)
    if (!files) {
      return next(new AppError(400, "There is no files to upload!"))
    }
    const uploadPromises = files.map(async (file) => {
      file.originalname = sanitizeFilename(file.originalname)
      return await b2client.uploadFile(file)
    })
    const fileData = await Promise.all(uploadPromises)
    res.locals.fileData = fileData
    next()
  }
)

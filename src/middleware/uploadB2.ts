import { NextFunction, Response, Request } from "express";
import B2Client from "../utils/b2client";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/AppError";
import dotenv from "dotenv";
dotenv.config();

function sanitizeFilename(name: string) {
  name = name.replace(/ /g, "_");

  name = name.replace(/-/g, "_");

  name = name.replace(/[^\w.-]+/g, "");

  return name;
}

export const uploadToB2 = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const file = <Express.Multer.File>req.file;
    if (!file) {
      return next(new AppError(400, "There is no file to upload!"));
    }
    const keyId = process.env.B2_KEY_ID || "";
    const applicationKey = process.env.B2_APPLICATION_KEY || "";
    const b2client = new B2Client(keyId, applicationKey);

    file.originalname = sanitizeFilename(file.originalname);
    const fileData = await b2client.uploadFile(file);

    res.locals.fileData = fileData;
    next();
  },
);

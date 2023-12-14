import AppError from "../utils/AppError"
import multer from "multer"

const userFileFilter = async (
  req: Request,
  file: Express.Multer.File,
  cb: Function
) => {
  const ext = file.mimetype.split("/")[1]
  const accepted = ["pdf"]
  if (!accepted.includes(ext)) {
    cb(new AppError(400, `Only ["pdf"] files allowed`), false)
  } else {
    cb(null, true)
  }
}
const memoryStorage = multer.memoryStorage()
const memoryMulter = multer({
  storage: memoryStorage,
  fileFilter: userFileFilter as any,
})
export default memoryMulter

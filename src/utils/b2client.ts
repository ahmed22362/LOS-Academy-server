import B2 from "backblaze-b2"
import AppError from "./AppError"
import logger from "./logger"
import dotenv from "dotenv"
dotenv.config()

export default class B2Client {
  private b2: B2
  constructor(keyId: string, appKey: string) {
    this.b2 = new B2({
      applicationKeyId: keyId,
      applicationKey: appKey,
    })
  }
  async getAuthToken() {
    try {
      const authResponse = await this.b2.authorize()
      return authResponse.data
    } catch (error: any) {
      logger.error(error)
      throw new AppError(400, "Error while Authenticate B2Client!")
    }
  }
  async getUploadLink(bucketId: string) {
    try {
      const response = await this.b2.getUploadUrl({ bucketId })
      return response
    } catch (error: any) {
      logger.error(error)
      throw new AppError(400, "Error while Getting Upload Link in B2Client!")
    }
  }
  async uploadFile(file: Express.Multer.File) {
    const authResponse = await this.getAuthToken()
    const { downloadUrl } = authResponse
    const bucketId = process.env.LOS_Bucket_ID || ""
    const response = await this.getUploadLink(bucketId)
    const { authorizationToken, uploadUrl } = response.data
    try {
      const params = {
        uploadUrl,
        uploadAuthToken: authorizationToken,
        fileName: file.originalname,
        data: file.buffer,
      }
      const fileInfo = await this.b2.uploadFile(params)
      const fileName = fileInfo.data.fileName as string
      const url = `${downloadUrl}/file/${
        process.env.LOS_Bucket_NAME
      }/${fileName.replace(" ", "_")}`
      const fileDate = {
        fileName: fileInfo.data.fileName,
        fileUrl: url,
        fileId: fileInfo.data.fileId,
      }
      return fileDate
    } catch (error) {
      logger.error(error)
      throw new AppError(400, "There is problem while uploading the Files")
    }
  }
  async deleteFile(fileId: string) {
    await this.getAuthToken()
    try {
      await this.b2.downloadFileById({ fileId, responseType: "json" })
    } catch (error) {
      throw new AppError(
        400,
        "there is some wrong happened while deleting the file!"
      )
    }
  }
}

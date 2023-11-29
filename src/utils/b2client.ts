import B2 from "backblaze-b2"
import logger from "./logger"
import dotenv from "dotenv"
dotenv.config()

interface StandardApiResponse {
  status: number
  statusText: string
  headers: any
  config: any
  request: any
  data: any
}

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
    }
  }
  async getUploadLink(bucketId: string) {
    try {
      const response = await this.b2.getUploadUrl({ bucketId })
      return response
    } catch (error: any) {
      logger.error(error)
    }
  }
  async uploadFile(file: Express.Multer.File) {
    const authResponse = await this.getAuthToken()
    const { downloadUrl } = authResponse
    const bucketId = process.env.LOS_Bucket_ID || ""
    const response: StandardApiResponse | undefined = await this.getUploadLink(
      bucketId
    )
    if (!response) {
      logger.error(`There is no response for getting upload link`)
      return
    }
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
    }
  }
  async deleteFile(fileId: string) {
    await this.getAuthToken()
    try {
      await this.b2.downloadFileById({ fileId, responseType: "json" })
    } catch (error) {
      logger.error(`Error while deleting file: ${error}`)
    }
  }
}

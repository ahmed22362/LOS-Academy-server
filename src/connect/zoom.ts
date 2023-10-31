import dotenv from "dotenv"
import axios, { AxiosRequestConfig } from "axios"
import AppError from "../utils/AppError"
import qs from "qs"

dotenv.config()
interface MeetingOptions {
  userId?: string
  topic: string
  duration: number
  start_date?: string
  start_time?: string
  startDateTime: Date
}
const clientId = process.env.ZOOM_CLIENT_ID as string
const accountId = process.env.ZOOM_ACCOUNT_ID as string
const clientSecret = process.env.ZOOM_CLIENT_SECRET as string
const auth_token_url = "https://zoom.us/oauth/token"
const api_base_url = "https://api.zoom.us/v2"

export default class ZoomService {
  private async getAuthToken(): Promise<string> {
    const postData = qs.stringify({
      grant_type: "account_credentials",
      account_id: accountId,
    })
    const authHeader = `Basic ${Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString("base64")}`

    const config: AxiosRequestConfig = {
      method: "post",
      url: auth_token_url,
      headers: {
        Host: "zoom.us",
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: postData,
    }
    try {
      const res = await axios(config)
      if (res.status !== 200) {
        console.log("Unable to get access token")
        throw new AppError(400, "Can't auth with zoom")
      }
      const accessToken = res.data.access_token
      if (!accessToken) {
        throw new AppError(400, "Can't get token")
      }
      return accessToken
    } catch (error) {
      console.log(error)
      throw new AppError(400, "some thing went wrong while auth with zoom!")
    }
  }

  async createMeeting({
    topic,
    duration,
    startDateTime,
  }: MeetingOptions): Promise<string> {
    const access_token = await this.getAuthToken()
    const headers = {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    }
    // console.log(start_time, start_date)
    // const startTime = `${start_date}T${start_time}`
    console.log({ "in create link method": startDateTime })
    const payload = {
      topic: topic,
      duration: duration,
      start_time: startDateTime,
      type: 2,
      settings: {
        join_before_host: true,
        waiting_room: false,
      },
    }
    const meetingResponse = await axios.post(
      `${api_base_url}/users/me/meetings`,
      payload,
      { headers }
    )

    if (meetingResponse.status !== 201) {
      console.log("Unable to generate meeting link")
      throw new AppError(400, "Can't generate meeting link!")
    }
    const response_data = meetingResponse.data
    const content = {
      meeting_url: response_data.join_url,
      password: response_data.password,
      meetingTime: response_data.start_time,
      purpose: response_data.topic,
      duration: response_data.duration,
      message: "Success",
      status: 1,
    }
    console.log(content)
    return response_data.join_url
  }
}

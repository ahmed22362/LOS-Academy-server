import dotenv from "dotenv"
import axios from "axios"
import logger from "../utils/logger"
import qs from "qs"

dotenv.config()

interface GoogleTokensResult {
  access_token: string
  expires_in: Number
  refresh_token: string
  scope: string
  id_token: string
}
export function getGoogleOAuthURL({
  redirect_uri,
  client_id,
}: {
  redirect_uri: string
  client_id: string
}) {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth"

  const options = {
    redirect_uri: redirect_uri,
    client_id: client_id,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  }

  const qs = new URLSearchParams(options)
  return `${rootUrl}?${qs.toString()}`
}

export async function getGoogleOAuthTokens({
  code,
}: {
  code: string
}): Promise<GoogleTokensResult> {
  const url = "https://oauth2.googleapis.com/token"
  const google_redirect_url = process.env.GOOGLE_REDIRECT_URL_PRO as string
  const google_redirect_url_local = process.env
    .GOOGLE_REDIRECT_URL_LOCAL as string
  let runningRedirectLink = google_redirect_url
  if (process.env.NODE_ENV?.trim() === "development") {
    runningRedirectLink = google_redirect_url_local
  }
  const values = {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: runningRedirectLink,
    grant_type: "authorization_code",
  }
  try {
    const res = await axios.post<GoogleTokensResult>(
      url,
      qs.stringify(values),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    )
    return res.data
  } catch (error: any) {
    console.error(error.response.data.error)
    logger.error(error, "Failed to fetch Google Oauth Tokens")
    throw new Error(error.message)
  }
}
interface GoogleUserResult {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
  locale: string
}
export async function getGoogleUser({
  id_token,
  access_token,
}: {
  id_token: string
  access_token: string
}): Promise<GoogleUserResult> {
  try {
    const res = await axios.get<GoogleUserResult>(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    )
    return res.data
  } catch (error: any) {
    logger.error(error, "Error fetching Google user")
    throw new Error(error.message)
  }
}

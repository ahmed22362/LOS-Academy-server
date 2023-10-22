import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

const JWT_SECRET: string = process.env.JWT_PRIVATE_KEY as string
export const singJWTToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN as string,
  })
}

export async function verifyToken(token: string) {
  return (await jwt.verify(token, JWT_SECRET)) as Promise<object>
}

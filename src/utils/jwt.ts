import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_PRIVATE_KEY!;

if (!JWT_SECRET) {
  throw new Error('JWT_PRIVATE_KEY is not defined in environment variables');
}

export const singJWTToken = (payload: any): string => {
  const now = Math.floor(Date.now() / 1000);
  const expiration = now + 60 * 24 * 60 * 60; // 60 days in seconds

  return jwt.sign({ ...payload, exp: expiration }, JWT_SECRET);
};

export interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

export const verifyToken = (token: string): DecodedToken => {
  return jwt.verify(token, JWT_SECRET) as DecodedToken;
};

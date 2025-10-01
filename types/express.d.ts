// types/express.d.ts
import User from "../db/models/user.model";
import Teacher from "../db/models/teacher.model";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      teacher?: Teacher;
    }
  }
}
export {};

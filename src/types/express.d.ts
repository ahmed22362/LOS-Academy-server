import "express-serve-static-core";
import User from "../db/models/user.model";
import Teacher from "../db/models/teacher.model";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
    teacher?: Teacher;
  }
}

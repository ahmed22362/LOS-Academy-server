import {
  Table,
  Column,
  Model,
  DataType,
  BeforeSave,
  HasMany,
} from "sequelize-typescript";
import { ulid } from "ulid";
import bcrypt from "bcrypt";
import crypto from "crypto";

import FreeSession from "./sessionReq.model";

export interface IUserInput {
  name: string;
  email: string;
  password?: string;
  phone: string;
  age: number;
  remainSessions?: number;
  availableFreeSession?: number;
  verified?: boolean;
  gender: Gender;
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
}
export const USER_TABLE_NAME = "user";

@Table({
  tableName: USER_TABLE_NAME,
  freezeTableName: true,
  timestamps: true,
})
export default class User extends Model<User> {
  @Column({
    type: DataType.STRING,
    defaultValue: () => ulid(),
    primaryKey: true,
  })
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  age!: number;

  @Column({ type: DataType.ENUM({ values: Object.values(Gender) }) })
  gender!: Gender;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phone?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  customerId?: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 2,
    validate: {
      min: 0, // Minimum value is 0
      max: 2, // Maximum value is 2
    },
  })
  availableFreeSession!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isEmail: { msg: "Please provide a valid email" },
    },
    unique: true,
  })
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password!: string;

  @Column(DataType.DATE)
  passwordChangedAt?: Date;

  @Column(DataType.STRING)
  passwordResetCode?: string | null;

  @Column(DataType.DATE)
  passwordResetExpire?: Date | null;

  @Column(DataType.STRING)
  imageUrl?: string | null;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0,
    },
  })
  remainSessions!: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  verified!: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  OTPToken?: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  OTPexpireAt?: Date | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: false, allowNull: false })
  sessionPlaced!: boolean;

  @HasMany(() => FreeSession)
  sessions!: FreeSession[];

  @BeforeSave
  static async hashPassword(instance: User) {
    if (instance.changed("password")) {
      const salt = await bcrypt.genSalt(12);
      instance.password = await bcrypt.hash(instance.password, salt);
      instance.passwordChangedAt = new Date(Date.now());
    }
  }

  async correctPassword(candidatePassword: string, userPassword: string) {
    return await bcrypt.compare(candidatePassword, userPassword);
  }

  changedPasswordAfter(JWTTimestamp: number) {
    if (this.passwordChangedAt) {
      const changedPasswordSec = parseInt(
        String(this.passwordChangedAt.getTime() / 1000),
        10,
      );
      return JWTTimestamp < changedPasswordSec;
    }
    return false;
  }

  createPasswordResetCode() {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedCode: string = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.passwordResetCode = hashedCode;
    this.passwordResetExpire = new Date(Date.now() + 20 * 60 * 2000); // 20 minutes
    return resetToken;
  }
  async createVerifyEmailCode() {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedCode: string = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.OTPToken = hashedCode;
    this.OTPexpireAt = new Date(Date.now() + 20 * 60 * 3000); // 20 minutes
    await this.save();
    return resetToken;
  }
}

import {
  Table,
  Column,
  Model,
  DataType,
  BeforeSave,
  DeletedAt,
} from "sequelize-typescript";
import { ulid } from "ulid";
import bcrypt from "bcrypt";

export interface ITeacherInput {
  name: string;
  nationalId: string;
  email: string;
  password: string;
  phone: string;
  customerId?: string;
  hour_cost: number;
  balance?: number;
  committed_mis?: number;
  permanent_meeting_url?: string;
}
export enum RoleType {
  TEACHER = "teacher",
  ADMIN = "admin",
  USER = "user",
}
export const TEACHER_TABLE_NAME = "teacher";

@Table({
  tableName: TEACHER_TABLE_NAME,
  timestamps: true,
  freezeTableName: true,
})
export default class Teacher extends Model<Teacher> {
  @Column({
    type: DataType.STRING,
    defaultValue: () => ulid(),
    primaryKey: true,
    allowNull: false,
  })
  id!: string;
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    unique: true,
  })
  nationalId!: string;
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

  @Column({ type: DataType.FLOAT, allowNull: false })
  hour_cost!: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  committed_mins!: number;

  @Column({ type: DataType.DOUBLE, defaultValue: 0 })
  balance!: number;

  @Column(DataType.DATE)
  passwordChangedAt?: Date;

  @Column({ type: DataType.STRING, allowNull: false })
  permanent_meeting_url!: string;

  @Column({
    type: DataType.ENUM({ values: Object.values(RoleType) }),
    defaultValue: RoleType.TEACHER,
  })
  role!: RoleType;

  @BeforeSave
  static async hashPassword(instance: Teacher) {
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
}

import {
  Table,
  Column,
  Model,
  DataType,
  BeforeSave,
} from "sequelize-typescript"
import { ulid } from "ulid"
import bcrypt from "bcrypt"

export interface ITeacherInput extends Teacher {
  fName: string
  lName: string
  nationalId: string
  email: string
  password: string
  phone: string
  customerId?: string
}
export enum RoleType {
  TEACHER = "teacher",
  ADMIN = "admin",
}
@Table({
  tableName: "teacher",
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
  id!: string
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  fName!: string
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  lName!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  biography?: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    unique: true,
  })
  nationalId!: string
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phone?: string

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  customerId?: string
  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isEmail: { msg: "Please provide a valid email" },
    },
    unique: true,
  })
  email!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password!: string

  @Column(DataType.DATE)
  passwordChangedAt?: Date

  @Column({
    type: DataType.ENUM({ values: Object.values(RoleType) }),
    defaultValue: RoleType.TEACHER,
  })
  role!: RoleType

  @BeforeSave
  static async hashPassword(instance: Teacher) {
    if (instance.changed("password")) {
      const salt = await bcrypt.genSalt(12)
      instance.password = await bcrypt.hash(instance.password, salt)
      instance.passwordChangedAt = new Date(Date.now())
    }
  }

  async correctPassword(candidatePassword: string, userPassword: string) {
    return await bcrypt.compare(candidatePassword, userPassword)
  }

  changedPasswordAfter(JWTTimestamp: number) {
    if (this.passwordChangedAt) {
      const changedPasswordSec = parseInt(
        String(this.passwordChangedAt.getTime() / 1000),
        10
      )
      return JWTTimestamp < changedPasswordSec
    }
    return false
  }
}

import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  AutoIncrement,
  PrimaryKey,
  HasOne,
} from "sequelize-typescript"
import User from "./user.model"
import Teacher from "./teacher.model"

export enum SessionType {
  FREE = "free",
  PAID = "paid",
  NOT_ASSIGN = "not assign",
}

@Table({
  tableName: "session",
  timestamps: true,
  freezeTableName: true,
})
export default class Session extends Model<Session> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: number

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: "user_teacher",
  })
  userId?: string

  @BelongsTo(() => User, { foreignKey: "userId" })
  user?: User

  @ForeignKey(() => Teacher)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: "user_teacher",
  })
  teacherId?: string

  @BelongsTo(() => Teacher, { foreignKey: "teacherId" })
  teacher?: Teacher

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  sessionDate!: Date

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionDuration!: number

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  meetingLink!: string

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @Column({
    type: DataType.ENUM({ values: Object.values(SessionType) }),
    allowNull: false,
    defaultValue: SessionType.NOT_ASSIGN,
  })
  type!: SessionType
}

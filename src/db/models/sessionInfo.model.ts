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
} from "sequelize-typescript"
import User from "./user.model"
import Teacher from "./teacher.model"
import SessionReq from "./sessionReq.model"

@Table({
  tableName: "session_info",
  timestamps: true,
  freezeTableName: true,
})
export default class SessionInfo extends Model<SessionInfo> {
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
    unique: "user_teacher",
  })
  userId?: string

  @BelongsTo(() => User, { foreignKey: "userId" })
  user?: User

  @ForeignKey(() => Teacher)
  @Column({
    type: DataType.STRING,
    unique: "user_teacher",
  })
  teacherId?: string

  @BelongsTo(() => Teacher, { foreignKey: "teacherId" })
  teacher?: Teacher

  @ForeignKey(() => SessionReq)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionRequestId?: number

  @BelongsTo(() => SessionReq, { foreignKey: "sessionRequestId" })
  sessionRequest?: SessionReq

  @Column({ type: DataType.BOOLEAN, allowNull: true })
  willContinue?: boolean

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date
}

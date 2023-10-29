import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript"
import User from "./user.model"
import { SessionStatus, SessionType } from "./session.model"

@Table({
  tableName: "session_request",
  timestamps: true,
  freezeTableName: true,
})
export default class SessionReq extends Model<SessionReq> {
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
    allowNull: false,
  })
  userId!: string

  @BelongsTo(() => User)
  user!: User

  @Column({
    type: DataType.ARRAY(DataType.DATE),
  })
  sessionDates!: Date[]

  @Column({
    type: DataType.TIME,
    allowNull: false,
  })
  sessionStartTime!: string

  @Column({
    type: DataType.ENUM({ values: Object.values(SessionStatus) }),
    defaultValue: SessionStatus.PENDING,
  })
  status!: SessionStatus

  @Column({
    type: DataType.ENUM({ values: Object.values(SessionType) }),
    defaultValue: SessionType.NOT_ASSIGN,
  })
  type!: SessionType
}

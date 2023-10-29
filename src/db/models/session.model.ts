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
import SessionInfo from "./sessionInfo.model"

export enum SessionStatus {
  PENDING = "pending",
  DONE = "done",
  TAKEN = "taken",
  ABSENT = "absent",
}
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

  @BelongsTo(() => SessionInfo)
  SessionInfo!: SessionInfo

  @ForeignKey(() => SessionInfo)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionInfoId!: number
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

  @Column({ type: DataType.BOOLEAN, defaultValue: false, allowNull: false })
  teacherAttended!: boolean
  @Column({ type: DataType.BOOLEAN, defaultValue: false, allowNull: false })
  studentAttended!: boolean

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  meetingLink?: string
}

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
import Session from "./session.model"
import FreeSessionReq from "./sessionFreeReq.model"

export enum FreeSessionStatus {
  PENDING = "pending",
  DONE = "done",
  TAKEN = "taken",
}

@Table({
  tableName: "freeSession",
  timestamps: true,
  freezeTableName: true,
})
export default class FreeSession extends Model<FreeSession> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: number

  @ForeignKey(() => FreeSessionReq)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionReqId!: number

  @BelongsTo(() => FreeSessionReq)
  sessionReq!: FreeSessionReq

  @BelongsTo(() => Session)
  session!: Session

  @ForeignKey(() => Session)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionId!: number

  @Column({
    type: DataType.ENUM({ values: Object.values(FreeSessionStatus) }),
    defaultValue: FreeSessionStatus.PENDING,
  })
  status!: FreeSessionStatus
}

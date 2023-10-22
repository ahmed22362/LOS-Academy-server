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
import Session from "./session.model"

export enum FreeSessionStatus {
  PENDING = "pending",
  DONE = "done",
  ABSENT = "absent",
}

@Table({
  tableName: "freeSessionRequest",
  timestamps: true,
  freezeTableName: true,
})
export default class FreeSessionReq extends Model<FreeSessionReq> {
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

  @Column
  date!: Date

  @Column({
    type: DataType.ENUM({ values: Object.values(FreeSessionStatus) }),
    defaultValue: FreeSessionStatus.PENDING,
  })
  status!: FreeSessionStatus
}

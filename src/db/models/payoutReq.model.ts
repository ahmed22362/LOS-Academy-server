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
import Teacher from "./teacher.model"

export enum PayoutRequestStatus {
  PENDING = "pending",
  DONE = "done",
  PROCESSING = "processing",
}

@Table({
  tableName: "payout_request",
  timestamps: true,
})
export default class PayOutRequest extends Model<PayOutRequest> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: number
  @ForeignKey(() => Teacher)
  @Column({ type: DataType.STRING, allowNull: false })
  teacherId!: string

  @BelongsTo(() => Teacher, { foreignKey: "teacherId" })
  teacher!: Teacher

  @Column({ type: DataType.INTEGER, allowNull: false })
  amount!: number

  @Column({
    type: DataType.ENUM({ values: Object.values(PayoutRequestStatus) }),
    defaultValue: PayoutRequestStatus.PENDING,
  })
  status!: PayoutRequestStatus
}

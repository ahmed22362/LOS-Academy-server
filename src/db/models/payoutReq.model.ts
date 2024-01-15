import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  DeletedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import Teacher from "./teacher.model";

export enum PayoutRequestStatus {
  PENDING = "pending",
  DONE = "done",
  PROCESSING = "processing",
}
export const PAYOUT_REQUEST_TABLE_NAME = "payout_request";

@Table({
  tableName: PAYOUT_REQUEST_TABLE_NAME,
  timestamps: true,
})
export default class PayOutRequest extends Model<PayOutRequest> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: number;
  @ForeignKey(() => Teacher)
  @Column({ type: DataType.STRING, allowNull: false })
  teacherId!: string;

  @BelongsTo(() => Teacher, { foreignKey: "teacherId" })
  teacher!: Teacher;

  @Column({ type: DataType.INTEGER, allowNull: false })
  amount!: number;

  @Column({
    type: DataType.ENUM({ values: Object.values(PayoutRequestStatus) }),
    defaultValue: PayoutRequestStatus.PENDING,
  })
  status!: PayoutRequestStatus;

  @DeletedAt
  declare deletedAt: Date | null;
}

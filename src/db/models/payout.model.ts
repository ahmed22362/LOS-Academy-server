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

export enum PayoutStatus {
  PENDING = "pending",
  DONE = "done",
  PROCESSING = "processing",
}
export const PAYOUT_REQUEST_TABLE_NAME = "payout";

@Table({
  tableName: PAYOUT_REQUEST_TABLE_NAME,
  timestamps: true,
})
export default class PayOut extends Model<PayOut> {
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

  @BelongsTo(() => Teacher, { foreignKey: "teacherId", onDelete: "CASCADE" })
  teacher!: Teacher;

  @Column({ type: DataType.FLOAT, allowNull: false })
  amount!: number;

  @Column({
    type: DataType.ENUM({ values: Object.values(PayoutStatus) }),
    defaultValue: PayoutStatus.DONE,
    allowNull: true,
  })
  status?: PayoutStatus;
}

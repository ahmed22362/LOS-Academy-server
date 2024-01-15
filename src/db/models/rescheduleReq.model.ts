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
import Session from "./session.model";
import { RoleType } from "./teacher.model";

export enum RescheduleRequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  DECLINED = "declined",
  NO_RESPONSE = "no_response",
}
export const RESCHEDULE_REQUEST_TABLE_NAME = "reschedule_request";

@Table({
  tableName: RESCHEDULE_REQUEST_TABLE_NAME,
  timestamps: true,
})
export default class RescheduleRequest extends Model<RescheduleRequest> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: number;
  @ForeignKey(() => Session)
  @Column({ type: DataType.INTEGER, allowNull: false })
  sessionId!: number;

  @BelongsTo(() => Session, { foreignKey: "sessionId" })
  session!: Session;

  @Column({ type: DataType.DATE, allowNull: false })
  oldDate!: Date;

  @Column({ type: DataType.ARRAY(DataType.DATE), allowNull: false })
  newDatesOptions!: Date[];

  @Column({ type: DataType.DATE })
  newDate!: Date;

  @Column({
    type: DataType.ENUM({ values: Object.values(RoleType) }),
    defaultValue: RoleType.USER,
  })
  requestedBy!: RoleType;

  @Column({
    type: DataType.ENUM({ values: Object.values(RescheduleRequestStatus) }),
    defaultValue: RescheduleRequestStatus.PENDING,
  })
  status!: RescheduleRequestStatus;
}

import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import Session from "./session.model";

export enum scheduledJobStatus {
  QUEUED = "queued",
  FAILED = "failed",
  COMPLETE = "complete",
}
export const SCHEDULE_JOB_TABLE_NAME = "schedule_job";

@Table({
  tableName: SCHEDULE_JOB_TABLE_NAME,
  timestamps: true,
  freezeTableName: true,
})
export default class ScheduleJob extends Model {
  @Column
  name!: string;

  @Column
  scheduledTime!: Date;

  @Column
  callbackName!: string;

  @Column({
    type: DataType.ENUM({ values: Object.values(scheduledJobStatus) }),
    defaultValue: scheduledJobStatus.QUEUED,
  })
  status!: scheduledJobStatus;

  @Column({ type: DataType.JSON })
  data!: JSON;

  @BelongsTo(() => Session, { foreignKey: "sessionId", onDelete: "CASCADE" })
  session!: Session;

  @ForeignKey(() => Session)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  sessionId!: number;
}

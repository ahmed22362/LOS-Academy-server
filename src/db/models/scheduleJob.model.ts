import { Column, DataType, Model, Table } from "sequelize-typescript";

let status: "QUEUED" | "COMPLETE" | "FAILED";

export enum scheduledJobStatus {
  QUEUED = "queued",
  FAILED = "failed",
  COMPLETE = "complete",
}
export const SCHEDULE_JOB_TABLE_NAME = "scheduleJob";

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
}

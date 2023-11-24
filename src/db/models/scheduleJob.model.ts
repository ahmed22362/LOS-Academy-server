import { Column, DataType, Model, Table } from "sequelize-typescript"

let status: "QUEUED" | "COMPLETE" | "FAILED"

export enum scheduledJobStatus {
  QUEUED = "queued",
  FAILED = "failed",
  COMPLETE = "complete",
}
@Table({ tableName: "scheduleJob", timestamps: true, freezeTableName: true })
export default class ScheduleJob extends Model {
  @Column
  name!: string

  @Column
  scheduledTime!: Date

  @Column
  callbackName!: string

  @Column({
    type: DataType.ENUM({ values: Object.values(scheduledJobStatus) }),
    defaultValue: scheduledJobStatus.QUEUED,
  })
  status!: scheduledJobStatus

  @Column({ type: DataType.JSON })
  data!: JSON
}

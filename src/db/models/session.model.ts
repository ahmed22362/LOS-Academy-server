import {
  AfterDestroy,
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import SessionInfo from "./sessionInfo.model";
import schedule from "node-schedule";

export enum SessionStatus {
  PENDING = "pending",
  ONGOING = "ongoing",
  TAKEN = "taken",
  USER_ABSENT = "user_absent",
  TEACHER_ABSENT = "teacher_absent",
  BOTH_ABSENT = "both_absent",
}
export enum SessionType {
  FREE = "free",
  PAID = "paid",
  NOT_ASSIGN = "not_assign",
}
export const SESSION_TABLE_NAME = "session";

@Table({
  tableName: SESSION_TABLE_NAME,
  timestamps: true,
  freezeTableName: true,
})
export class Session extends Model<Session> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: number;

  @BelongsTo(() => SessionInfo, { onDelete: "CASCADE" })
  sessionInfo!: SessionInfo | null;

  @ForeignKey(() => SessionInfo)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionInfoId!: number;
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  sessionDate!: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionDuration!: number;

  @Column({
    type: DataType.ENUM({ values: Object.values(SessionStatus) }),
    defaultValue: SessionStatus.PENDING,
  })
  status!: SessionStatus;
  @Column({
    type: DataType.ENUM({ values: Object.values(SessionType) }),
    defaultValue: SessionType.NOT_ASSIGN,
  })
  type!: SessionType;

  @Column({ type: DataType.BOOLEAN, defaultValue: false, allowNull: false })
  teacherAttended!: boolean;
  @Column({ type: DataType.BOOLEAN, defaultValue: false, allowNull: false })
  studentAttended!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  meetingLink?: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    validate: { min: 0, max: 4 },
  })
  reschedule_request_count!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  hasReport!: boolean;

  @AfterDestroy
  static async hashPassword(instance: Session) {
    const jobReminderName = `session #${instance.id} Reminder`;
    const jobStartedName = `session #${instance.id} Started`;
    const jobOngoingName = `session #${instance.id} ONGOING Updating`;
    const jobFinishedName = `session #${instance.id} finished Updating`;
    const jobs = schedule.scheduledJobs;
    const reminderJob = jobs[jobReminderName].cancel();
    const sessionStartedJob = jobs[jobStartedName].cancel();
    const sessionOngoingJob = jobs[jobOngoingName].cancel();
    const sessionFinishedJob = jobs[jobFinishedName].cancel();
  }
}

export default Session;

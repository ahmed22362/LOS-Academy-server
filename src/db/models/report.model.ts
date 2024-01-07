import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import Session from "./session.model";

export enum GradeOptions {
  EXCELLENT = "excellent",
  GOOD = "good",
  VERY_GOOD = "very good",
  AVERAGE = "average",
  BELOW_AVERAGE = "below average",
}
export interface ReportsCourses {
  courseName: string;
  courseGrade: GradeOptions;
  courseComment?: GradeOptions;
}
@Table({ tableName: "report", timestamps: true, freezeTableName: true })
export default class Report extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: number;

  @Column({
    type: DataType.ARRAY(DataType.JSONB),
    allowNull: false,
  })
  reportCourses!: ReportsCourses[];

  @Column({
    type: DataType.ENUM({ values: Object.values(GradeOptions) }),
    defaultValue: GradeOptions.AVERAGE,
  })
  grade!: GradeOptions;

  @Column({ type: DataType.TEXT, allowNull: true })
  comment?: string;

  @ForeignKey(() => Session)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionId!: number;
  @BelongsTo(() => Session)
  session!: Session;
}

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
import User from "./user.model";
import Teacher from "./teacher.model";

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
export const REPORT_TABLE_NAME = "report";

@Table({
  tableName: REPORT_TABLE_NAME,
  timestamps: true,
  freezeTableName: true,
})
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

  @Column({ type: DataType.STRING, allowNull: true })
  title?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING,
  })
  userId?: string;

  @BelongsTo(() => User, { foreignKey: "userId", onDelete: "CASCADE" })
  user?: User;

  @ForeignKey(() => Teacher)
  @Column({
    type: DataType.STRING,
  })
  teacherId?: string;

  @BelongsTo(() => Teacher, { foreignKey: "teacherId", onDelete: "CASCADE" })
  teacher?: Teacher;
}

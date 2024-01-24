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
import { GradeOptions, ReportsCourses } from "./report.model";
import User from "./user.model";
import Teacher from "./teacher.model";

export const MONTHLY_REPORT_TABLE_NAME = "monthly_report";

@Table({
  tableName: MONTHLY_REPORT_TABLE_NAME,
  timestamps: true,
  freezeTableName: true,
})
export default class MonthlyReport extends Model {
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

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  userId!: string;

  @BelongsTo(() => User, { onDelete: "CASCADE" })
  user!: User;

  @ForeignKey(() => Teacher)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  teacherId!: string;

  @BelongsTo(() => Teacher, { onDelete: "CASCADE" })
  teacher!: Teacher;
}

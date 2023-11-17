import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript"
import { GradeOptions } from "./report.model"
import User from "./user.model"

@Table({ tableName: "monthly_report", timestamps: true, freezeTableName: true })
export default class MonthlyReport extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: number
  @Column({ type: DataType.INTEGER, allowNull: true })
  arabicToPage?: number
  @Column({
    type: DataType.ENUM({ values: Object.values(GradeOptions) }),
    defaultValue: GradeOptions.AVERAGE,
  })
  arabicGrade?: GradeOptions
  @Column({ type: DataType.INTEGER, allowNull: true })
  quranToPage?: number
  @Column({
    type: DataType.ENUM({ values: Object.values(GradeOptions) }),
    defaultValue: GradeOptions.AVERAGE,
  })
  quranGrade?: GradeOptions
  @Column({ type: DataType.INTEGER, allowNull: true })
  islamicToPage?: number
  @Column({
    type: DataType.ENUM({ values: Object.values(GradeOptions) }),
    defaultValue: GradeOptions.AVERAGE,
  })
  islamicGrade?: GradeOptions

  @Column({ type: DataType.TEXT, allowNull: true })
  comment?: string

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  sessionInfoId!: string
  @BelongsTo(() => User)
  user!: User
}

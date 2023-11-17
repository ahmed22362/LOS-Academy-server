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
import Session from "./session.model"

export enum GradeOptions {
  EXCELLENT = "excellent",
  GOOD = "good",
  VERY_GOOD = "very good",
  AVERAGE = "average",
  BELOW_AVERAGE = "below average",
}

@Table({ tableName: "report", timestamps: true, freezeTableName: true })
export default class Report extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: number
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string

  @Column({ type: DataType.TEXT, allowNull: true })
  arabic?: string | null
  @Column({ type: DataType.TEXT, allowNull: true })
  islamic?: string | null
  @Column({ type: DataType.TEXT, allowNull: true })
  quran?: string | null

  @Column({
    type: DataType.ENUM({ values: Object.values(GradeOptions) }),
    defaultValue: GradeOptions.AVERAGE,
  })
  grade!: GradeOptions

  @Column({ type: DataType.TEXT, allowNull: true })
  comment?: string

  @ForeignKey(() => Session)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionId!: number
  @BelongsTo(() => Session)
  session!: Session
}

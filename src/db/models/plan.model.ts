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
import Course from "./course.model"

@Table({ tableName: "plan", timestamps: true, freezeTableName: true })
export default class Plan extends Model {
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

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionDuration!: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionsCount!: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  price!: number

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  active!: boolean

  @ForeignKey(() => Course)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  courseId!: number

  @BelongsTo(() => Course)
  course!: Course

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  stripePriceId!: string
}

import {
  AutoIncrement,
  BeforeCreate,
  BeforeSave,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript"
import { createStripePrice } from "../../service/stripe.service"

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
  sessionsPerWeek!: number

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

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  stripePriceId!: string
}

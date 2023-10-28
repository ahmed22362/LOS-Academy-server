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
import User from "./user.model"
import Plan from "./plan.model"

@Table({ tableName: "subscription", timestamps: true, freezeTableName: true })
export default class Subscription extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: number

  @Column({
    type: DataType.STRING,
    defaultValue: "pending",
  })
  status!: string

  @Column({ type: DataType.STRING, allowNull: true })
  stripe_subscription_id!: string | null | undefined

  @Column
  stripe_checkout_session_id!: string

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  userId!: String

  @BelongsTo(() => User)
  user!: User

  @ForeignKey(() => Plan)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  planId!: number

  @BelongsTo(() => Plan)
  plan!: Plan
}

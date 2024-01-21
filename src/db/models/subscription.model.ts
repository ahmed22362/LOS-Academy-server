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
import Plan from "./plan.model";
export enum SubscriptionStatus {
  INCOMPLETE = "incomplete",
  INCOMPLETE_EXPIRED = "incomplete_expired",
  TRIALING = "trialing",
  ACTIVE = "active",
  PAST_DUE = "past_due",
  CANCELED = "canceled",
  UNPAID = "unpaid",
}
export const SUBSCRIPTION_TABLE_NAME = "subscription";

@Table({
  tableName: SUBSCRIPTION_TABLE_NAME,
  timestamps: true,
  freezeTableName: true,
})
export default class Subscription extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: number;

  @Column({
    type: DataType.ENUM({ values: Object.values(SubscriptionStatus) }),
    defaultValue: SubscriptionStatus.INCOMPLETE,
  })
  status!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  stripe_subscription_id?: string | null;

  @Column
  stripe_checkout_session_id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  userId!: string;

  @BelongsTo(() => User, { onDelete: "CASCADE" })
  user!: User;

  @ForeignKey(() => Plan)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  planId!: number;

  @BelongsTo(() => Plan, { onDelete: "CASCADE" })
  plan!: Plan;
}

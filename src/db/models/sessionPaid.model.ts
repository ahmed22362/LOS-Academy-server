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
import User from "./user.model"
import Teacher from "./teacher.model"

@Table({
  tableName: "paidSession",
  timestamps: true,
  freezeTableName: true,
})
export default class PaidSession extends Model<PaidSession> {
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

  @BelongsTo(() => Session)
  session!: Session
  @ForeignKey(() => Session)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionId!: number
}

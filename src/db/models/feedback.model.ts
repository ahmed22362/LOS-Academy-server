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
export const FEEDBACK_TABLE_NAME = "feedback";

@Table({
  tableName: FEEDBACK_TABLE_NAME,
  timestamps: true,
  freezeTableName: true,
})
export default class Feedback extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: number;
  @ForeignKey(() => User)
  @Column({ type: DataType.STRING, allowNull: false })
  userId!: string;

  @BelongsTo(() => User, { foreignKey: "userId", onDelete: "CASCADE" })
  user!: User;

  @Column({
    type: DataType.STRING,
  })
  feedback!: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  show!: boolean;
}

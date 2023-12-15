import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import User from "./user.model";

@Table({ tableName: "feedback", timestamps: true, freezeTableName: true })
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

  @BelongsTo(() => User, { foreignKey: "userId" })
  user!: User;

  @Column({
    type: DataType.STRING,
  })
  feedback!: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  show!: boolean;
}

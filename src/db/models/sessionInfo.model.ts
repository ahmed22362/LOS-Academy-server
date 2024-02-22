import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  AutoIncrement,
  PrimaryKey,
  DeletedAt,
} from "sequelize-typescript";
import User from "./user.model";
import Teacher from "./teacher.model";

export const SESSION_INFO_TABLE_NAME = "session_info";

@Table({
  tableName: SESSION_INFO_TABLE_NAME,
  timestamps: true,
  freezeTableName: true,
})
export default class SessionInfo extends Model<SessionInfo> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING,
    unique: "user_teacher",
  })
  userId?: string;

  @BelongsTo(() => User, { foreignKey: "userId", onDelete: "CASCADE" })
  user?: User;

  @ForeignKey(() => Teacher)
  @Column({
    type: DataType.STRING,
    unique: "user_teacher",
  })
  teacherId?: string;

  @BelongsTo(() => Teacher, { foreignKey: "teacherId", onDelete: "CASCADE" })
  teacher?: Teacher;

  @Column({ type: DataType.BOOLEAN, allowNull: true })
  willContinue?: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}

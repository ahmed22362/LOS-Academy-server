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
import { SessionStatus, SessionType } from "./session.model";

export const SESSION_REQUEST_TABLE_NAME = "session_request";

@Table({
  tableName: SESSION_REQUEST_TABLE_NAME,
  timestamps: true,
  freezeTableName: true,
})
export default class SessionReq extends Model<SessionReq> {
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
    allowNull: false,
  })
  userId!: string;

  @BelongsTo(() => User, { onDelete: "CASCADE" })
  user!: User;

  @Column({
    type: DataType.ARRAY(DataType.DATE),
  })
  sessionDates!: Date[];

  @Column({
    type: DataType.ARRAY(DataType.STRING),
  })
  courses!: string[];

  @Column({
    type: DataType.ENUM({ values: Object.values(SessionStatus) }),
    defaultValue: SessionStatus.PENDING,
  })
  status!: SessionStatus;

  @Column({
    type: DataType.ENUM({ values: Object.values(SessionType) }),
    defaultValue: SessionType.NOT_ASSIGN,
  })
  type!: SessionType;
}

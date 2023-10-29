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

  @ForeignKey(() => Session)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionId!: number
  @BelongsTo(() => Session)
  session!: Session
}

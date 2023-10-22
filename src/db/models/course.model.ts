import {
  AutoIncrement,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript"

@Table({ tableName: "course", timestamps: true, freezeTableName: true })
export default class Course extends Model {
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
    type: DataType.STRING,
  })
  description!: string

  @Column({
    type: DataType.STRING,
  })
  stripeProductId!: string
}

import {
  AutoIncrement,
  Column,
  DataType,
  DeletedAt,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
export const COURSE_TABLE_NAME = "course";
@Table({
  tableName: COURSE_TABLE_NAME,
  timestamps: true,
  freezeTableName: true,
})
export default class Course extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: number;
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.STRING,
  })
  description!: string;

  @Column({
    type: DataType.TEXT,
  })
  details!: string;

  @Column({
    type: DataType.STRING,
  })
  stripeProductId!: string;

  @DeletedAt
  declare deletedAt: Date | null;
}

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
import Teacher from "./teacher.model"

export enum MaterialStatus {
  NEW_ARRIVAL = "new Arrival",
  ACTIVE = "active",
  ARCHIVED = "archived",
}

@Table({
  tableName: "material",
  timestamps: true,
})
export default class Material extends Model<Material> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: number

  @ForeignKey(() => Teacher)
  @Column({ type: DataType.STRING, allowNull: false })
  teacherId!: string

  @BelongsTo(() => Teacher, { foreignKey: "teacherId" })
  teacher!: Teacher

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string
  @Column({ type: DataType.STRING, allowNull: false })
  course!: string
  @Column({ type: DataType.INTEGER, allowNull: false })
  age!: number
  @Column({
    type: DataType.ENUM({ values: Object.values(MaterialStatus) }),
    defaultValue: MaterialStatus.NEW_ARRIVAL,
  })
  status!: MaterialStatus
  @Column({ type: DataType.STRING, allowNull: false })
  b2Link!: string
  @Column({ type: DataType.STRING, allowNull: false })
  b2FileId!: string
}

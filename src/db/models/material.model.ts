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
import Teacher from "./teacher.model";

export const MATERIAL_TABLE_NAME = "material";

export enum MaterialStatus {
  NEW_ARRIVAL = "new Arrival",
  ACTIVE = "active",
  ARCHIVED = "archived",
}

@Table({
  tableName: MATERIAL_TABLE_NAME,
  timestamps: true,
})
export default class Material extends Model<Material> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: number;

  @ForeignKey(() => Teacher)
  @Column({ type: DataType.STRING, allowNull: false })
  teacherId!: string;

  @BelongsTo(() => Teacher, { foreignKey: "teacherId" })
  teacher!: Teacher;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;
  @Column({ type: DataType.STRING, allowNull: false })
  course!: string;
  @Column({ type: DataType.INTEGER, allowNull: false })
  age!: number;
  @Column({
    type: DataType.ENUM({ values: Object.values(MaterialStatus) }),
    defaultValue: MaterialStatus.NEW_ARRIVAL,
  })
  status!: MaterialStatus;
  @Column({ type: DataType.STRING, allowNull: false })
  b2Link!: string;
  @Column({ type: DataType.STRING, allowNull: false })
  b2FileId!: string;

  @DeletedAt
  declare deletedAt: Date | null;
}

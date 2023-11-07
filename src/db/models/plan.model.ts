import {
  AutoIncrement,
  BeforeCreate,
  BeforeSave,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript"

export enum PlanType {
  STANDARD = "standard",
  CUSTOM = "custom",
}

@Table({ tableName: "plan", timestamps: true, freezeTableName: true })
export default class Plan extends Model {
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
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionDuration!: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionsCount!: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  sessionsPerWeek!: number

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
  })
  price!: number

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  active!: boolean

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  stripePriceId!: string
  @Column({
    type: DataType.ENUM({ values: Object.values(PlanType) }),
    defaultValue: PlanType.CUSTOM,
  })
  type!: PlanType
}

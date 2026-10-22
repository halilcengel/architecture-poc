import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from "@canmingir/link-express/sequelize";

@Table({ tableName: "Task", timestamps: true, underscored: true })
class Task extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare text: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare status: "RUNNING" | "COMPLETED" | "FAILED";

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare result: string | null;
}

export default Task;

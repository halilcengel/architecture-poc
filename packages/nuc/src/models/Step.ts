import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from "@canmingir/link-express/sequelize";
import type { Parameters } from "../action";

@Table({ tableName: "Step", timestamps: true, underscored: true })
class Step extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare taskId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare action: string;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare parameters: Parameters;

  @AllowNull(true)
  @Column(DataType.FLOAT)
  declare hallucination: number | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare result: string | null;
}

export default Step;

import {
  AllowNull,
  Column,
  DataType,
  Default,
  IsIn,
  Model,
  PrimaryKey,
  Table,
} from "@canmingir/link-express/sequelize";

@Table({ tableName: "Message", timestamps: true, underscored: true })
class Message extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare channel: string;

  @AllowNull(false)
  @IsIn([["IN", "OUT"]])
  @Column(DataType.STRING)
  declare direction: "IN" | "OUT";

  @AllowNull(false)
  @Column(DataType.STRING)
  declare address: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare text: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare taskId: string;
}

export default Message;

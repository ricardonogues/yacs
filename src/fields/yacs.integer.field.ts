import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export class YacsIntegerField extends YacsField {
  private isUnsigned: boolean = false;
  private isAutoIncrement: boolean = false;

  constructor() {
    super();
    this.type = YacsFieldType.INTEGER;
  }

  public override primaryKey(): YacsIntegerField {
    super.primaryKey();
    return this;
  }

  public unsigned(): YacsIntegerField {
    this.isUnsigned = true;
    return this;
  }

  public autoIncrement(): YacsIntegerField {
    this.isAutoIncrement = true;
    return this;
  }

  public default(value: number): YacsIntegerField {
    super.default(value);
    return this;
  }

  get isUnsignedField(): boolean {
    return this.isUnsigned;
  }

  get isAutoIncrementField(): boolean {
    return this.isAutoIncrement;
  }
}

export function integer(): YacsIntegerField {
  return new YacsIntegerField();
}

export function serial(): YacsIntegerField {
  return new YacsIntegerField().autoIncrement().primaryKey();
}

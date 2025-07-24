import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export class YacsBigIntField extends YacsField {
  private isUnsigned: boolean = false;
  private isAutoIncrement: boolean = false;

  constructor() {
    super();
    this.type = YacsFieldType.BIGINT;
  }

  public override primaryKey(): YacsBigIntField {
    super.primaryKey();
    return this;
  }

  public unsigned(): YacsBigIntField {
    this.isUnsigned = true;
    return this;
  }

  public autoIncrement(): YacsBigIntField {
    this.isAutoIncrement = true;
    return this;
  }

  public default(value: number | bigint | string): YacsBigIntField {
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

export function bigint(): YacsBigIntField {
  return new YacsBigIntField();
}

export function bigserial(): YacsBigIntField {
  return new YacsBigIntField().autoIncrement().primaryKey();
}

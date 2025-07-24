import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export class YacsFloatField extends YacsField {
  constructor() {
    super();
    this.type = YacsFieldType.FLOAT;
  }

  public default(value: number): YacsFloatField {
    super.default(value);
    return this;
  }
}

export function float(): YacsFloatField {
  return new YacsFloatField();
}

export function double(): YacsFloatField {
  return new YacsFloatField();
}

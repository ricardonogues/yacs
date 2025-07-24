import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export class YacsJsonField extends YacsField {
  constructor() {
    super();
    this.type = YacsFieldType.JSON;
  }

  public default(value: any): YacsJsonField {
    super.default(value);
    return this;
  }
}

export function json(): YacsJsonField {
  return new YacsJsonField();
}

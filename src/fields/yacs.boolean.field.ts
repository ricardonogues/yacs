import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export class YacsBooleanField extends YacsField {
  constructor() {
    super();
    this.type = YacsFieldType.BOOLEAN;
  }

  public default(value: boolean): YacsBooleanField {
    super.default(value);
    return this;
  }
}

export function boolean(): YacsBooleanField {
  return new YacsBooleanField();
}

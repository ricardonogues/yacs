import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export class YacsEmailField extends YacsField {
  constructor() {
    super();
    this.type = YacsFieldType.EMAIL;
  }

  public default(value: string): YacsEmailField {
    super.default(value);
    return this;
  }
}

export function email(): YacsEmailField {
  return new YacsEmailField();
}

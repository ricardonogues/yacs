import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export class YacsUrlField extends YacsField {
  constructor() {
    super();
    this.type = YacsFieldType.URL;
  }

  public default(value: string): YacsUrlField {
    super.default(value);
    return this;
  }
}

export function url(): YacsUrlField {
  return new YacsUrlField();
}

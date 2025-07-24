import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export class YacsDateField extends YacsField {
  private withTime: boolean = false;

  constructor() {
    super();
    this.type = YacsFieldType.DATE;
  }

  public datetime(): YacsDateField {
    this.withTime = true;
    return this;
  }

  public default(value: Date | string): YacsDateField {
    super.default(value);
    return this;
  }

  get includesTime(): boolean {
    return this.withTime;
  }
}

export function date(): YacsDateField {
  return new YacsDateField();
}

export function timestamp(): YacsDateField {
  return new YacsDateField().datetime();
}

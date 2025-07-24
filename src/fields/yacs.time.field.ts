import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export class YacsTimeField extends YacsField {
  private withTimezone: boolean = false;

  constructor() {
    super();
    this.type = YacsFieldType.TIME;
  }

  public timezone(): YacsTimeField {
    this.withTimezone = true;
    return this;
  }

  public default(value: string | Date): YacsTimeField {
    super.default(value);
    return this;
  }

  get includesTimezone(): boolean {
    return this.withTimezone;
  }
}

export function time(): YacsTimeField {
  return new YacsTimeField();
}

export function timetz(): YacsTimeField {
  return new YacsTimeField().timezone();
}

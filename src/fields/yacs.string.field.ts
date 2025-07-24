import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export class YacsStringField extends YacsField {
  private maxLength?: number;

  constructor() {
    super();
    this.type = YacsFieldType.STRING;
  }

  public length(length: number): YacsStringField {
    this.maxLength = length;
    return this;
  }

  public default(value: string): YacsStringField {
    super.default(value);
    return this;
  }

  get maxLengthValue(): number | undefined {
    return this.maxLength;
  }
}

export function varchar(length?: number): YacsStringField {
  const field = new YacsStringField();
  if (length) field.length(length);
  return field;
}

export function text(): YacsStringField {
  return new YacsStringField();
}

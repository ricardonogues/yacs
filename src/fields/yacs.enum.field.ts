import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export class YacsEnumField extends YacsField {
  private enumValues: string[] = [];

  constructor() {
    super();
    this.type = YacsFieldType.ENUM;
  }

  public values(...values: string[]): YacsEnumField {
    this.enumValues = values;
    return this;
  }

  public default(value: string): YacsEnumField {
    super.default(value);
    return this;
  }

  get allowedValues(): string[] {
    return this.enumValues;
  }
}

export function enumField(...values: string[]): YacsEnumField {
  return new YacsEnumField().values(...values);
}

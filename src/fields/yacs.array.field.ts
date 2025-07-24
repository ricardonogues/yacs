import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export class YacsArrayField extends YacsField {
  private itemType: YacsFieldType;

  constructor(itemType: YacsFieldType) {
    super();
    this.type = YacsFieldType.ARRAY;
    this.itemType = itemType;
  }

  public default(value: any[]): YacsArrayField {
    super.default(value);
    return this;
  }

  get arrayItemType(): YacsFieldType {
    return this.itemType;
  }
}

export function array(itemType: YacsFieldType): YacsArrayField {
  return new YacsArrayField(itemType);
}

// Convenience functions for common array types
export function stringArray(): YacsArrayField {
  return array(YacsFieldType.STRING);
}

export function integerArray(): YacsArrayField {
  return array(YacsFieldType.INTEGER);
}

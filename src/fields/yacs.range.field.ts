import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export type RangeType = "int4range" | "int8range" | "numrange" | "tsrange" | "tstzrange" | "daterange";

export class YacsRangeField extends YacsField {
  private rangeType: RangeType;

  constructor(rangeType: RangeType) {
    super();
    this.type = YacsFieldType.RANGE;
    this.rangeType = rangeType;
  }

  public default(value: any): YacsRangeField {
    super.default(value);
    return this;
  }

  get rangeDataType(): RangeType {
    return this.rangeType;
  }
}

export function range(type: RangeType): YacsRangeField {
  return new YacsRangeField(type);
}

// Convenience functions for common range types
export function intRange(): YacsRangeField {
  return range("int4range");
}

export function bigintRange(): YacsRangeField {
  return range("int8range");
}

export function numericRange(): YacsRangeField {
  return range("numrange");
}

export function timestampRange(): YacsRangeField {
  return range("tsrange");
}

export function timestamptzRange(): YacsRangeField {
  return range("tstzrange");
}

export function dateRange(): YacsRangeField {
  return range("daterange");
}

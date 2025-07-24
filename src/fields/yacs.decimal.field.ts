import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export class YacsDecimalField extends YacsField {
  private _precision?: number;
  private _scale?: number;

  constructor() {
    super();
    this.type = YacsFieldType.DECIMAL;
  }

  public precision(precision: number, scale: number = 2): YacsDecimalField {
    this._precision = precision;
    this._scale = scale;
    return this;
  }

  public default(value: number | string): YacsDecimalField {
    super.default(value);
    return this;
  }

  get precisionValue(): number | undefined {
    return this._precision;
  }

  get scaleValue(): number | undefined {
    return this._scale;
  }
}

export function decimal(precision?: number, scale?: number): YacsDecimalField {
  const field = new YacsDecimalField();
  if (precision) field.precision(precision, scale);
  return field;
}

// For common use cases
export function money(): YacsDecimalField {
  return decimal(10, 2); // Standard for currency
}

export function percentage(): YacsDecimalField {
  return decimal(5, 4); // For percentages like 99.9999%
}

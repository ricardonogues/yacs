import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export class YacsIntervalField extends YacsField {
  private _fields?: string; // Can be 'YEAR', 'MONTH', 'DAY TO HOUR', etc.

  constructor() {
    super();
    this.type = YacsFieldType.INTERVAL;
  }

  public fields(fields: string): YacsIntervalField {
    this._fields = fields;
    return this;
  }

  public default(value: string): YacsIntervalField {
    super.default(value);
    return this;
  }

  get intervalFields(): string | undefined {
    return this._fields;
  }
}

export function interval(fields?: string): YacsIntervalField {
  const field = new YacsIntervalField();
  if (fields) field.fields(fields);
  return field;
}

// Convenience functions for common intervals
export function duration(): YacsIntervalField {
  return interval();
}

export function yearInterval(): YacsIntervalField {
  return interval("YEAR");
}

export function dayInterval(): YacsIntervalField {
  return interval("DAY");
}

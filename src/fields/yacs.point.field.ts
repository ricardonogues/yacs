import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export interface Point {
  x: number;
  y: number;
}

export class YacsPointField extends YacsField {
  constructor() {
    super();
    this.type = YacsFieldType.POINT;
  }

  public default(value: Point | string): YacsPointField {
    super.default(value);
    return this;
  }
}

export function point(): YacsPointField {
  return new YacsPointField();
}

// Convenience for geographic coordinates
export function coordinates(): YacsPointField {
  return new YacsPointField();
}

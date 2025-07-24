import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export class YacsBinaryField extends YacsField {
  private maxSize?: number;

  constructor() {
    super();
    this.type = YacsFieldType.BINARY;
  }

  public size(maxSize: number): YacsBinaryField {
    this.maxSize = maxSize;
    return this;
  }

  public default(value: Buffer): YacsBinaryField {
    super.default(value);
    return this;
  }

  get maxSizeValue(): number | undefined {
    return this.maxSize;
  }
}

export function binary(maxSize?: number): YacsBinaryField {
  const field = new YacsBinaryField();
  if (maxSize) field.size(maxSize);
  return field;
}

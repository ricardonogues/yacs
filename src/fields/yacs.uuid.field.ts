import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export class YacsUuidField extends YacsField {
  private generateDefault: boolean = false;

  constructor() {
    super();
    this.type = YacsFieldType.UUID;
  }

  public defaultGenerated(): YacsUuidField {
    this.generateDefault = true;
    return this;
  }

  public default(value: string): YacsUuidField {
    super.default(value);
    return this;
  }

  get shouldGenerateDefault(): boolean {
    return this.generateDefault;
  }
}

export function uuid(): YacsUuidField {
  return new YacsUuidField();
}

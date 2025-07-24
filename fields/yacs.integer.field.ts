import { YacsField } from "./yacs.field";

class YacsIntegerField extends YacsField {
  private isUnsigned: boolean = false;

  public unsigned(): YacsIntegerField {
    this.isUnsigned = true;
    return this;
  }

  public default(value: number): YacsIntegerField {
    super.default(value);
    return this;
  }

  get isUnsignedField(): boolean {
    return this.isUnsigned;
  }
}

export function integer(): YacsIntegerField {
  return new YacsIntegerField();
}

import { YacsFieldType } from "../types/yacs.types";

export class YacsField {
  private isNullable: boolean;
  private isPrimaryKey: boolean;
  private isUnique: boolean;
  private defaultValue: any;
  public type: YacsFieldType;

  public nullable(): YacsField {
    this.isNullable = true;
    return this;
  }

  public notNullable(): YacsField {
    this.isNullable = false;
    return this;
  }

  public primaryKey(): YacsField {
    this.isPrimaryKey = true;
    return this;
  }

  public unique(): YacsField {
    this.isUnique = true;
    return this;
  }

  public default(value: any): YacsField {
    this.defaultValue = value;
    return this;
  }

  get isNullableField(): boolean {
    return this.isNullable;
  }

  get isPrimaryKeyField(): boolean {
    return this.isPrimaryKey;
  }

  get isUniqueField(): boolean {
    return this.isUnique;
  }

  get defaultTypeValue(): any {
    return this.defaultValue;
  }
}

import { YacsField } from "./yacs.field";
import { YacsFieldType } from "../types/yacs.types";

export class YacsForeignKeyField extends YacsField {
  private referencedEntity: string;
  private referencedField: string;

  constructor(referencedEntity: string, referencedField: string = "id") {
    super();
    this.type = YacsFieldType.INTEGER; // Most foreign keys are integers
    this.referencedEntity = referencedEntity;
    this.referencedField = referencedField;
  }

  public default(value: number): YacsForeignKeyField {
    super.default(value);
    return this;
  }

  get referencesEntity(): string {
    return this.referencedEntity;
  }

  get referencesField(): string {
    return this.referencedField;
  }
}

export function foreignKey(referencedEntity: string, referencedField: string = "id"): YacsForeignKeyField {
  return new YacsForeignKeyField(referencedEntity, referencedField);
}

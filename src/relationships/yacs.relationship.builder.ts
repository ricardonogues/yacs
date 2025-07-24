import { YacsRelationshipConfig, YacsRelationType, YacsCascadeAction } from "../types/yacs.types";

export class YacsRelationshipBuilder {
  private config: Partial<YacsRelationshipConfig> = {};

  constructor(private type: YacsRelationType, private target: string) {
    this.config.type = type;
    this.config.target = target;
  }

  public foreignKey(fieldName: string): YacsRelationshipBuilder {
    this.config.foreignKey = fieldName;
    return this;
  }

  public localKey(fieldName: string): YacsRelationshipBuilder {
    this.config.localKey = fieldName;
    return this;
  }

  public through(tableName: string): YacsRelationshipBuilder {
    this.config.through = tableName;
    return this;
  }

  public throughKeys(foreignKey: string, targetKey: string): YacsRelationshipBuilder {
    this.config.throughForeignKey = foreignKey;
    this.config.throughTargetKey = targetKey;
    return this;
  }

  public onDelete(action: YacsCascadeAction): YacsRelationshipBuilder {
    this.config.onDelete = action;
    return this;
  }

  public onUpdate(action: YacsCascadeAction): YacsRelationshipBuilder {
    this.config.onUpdate = action;
    return this;
  }

  public nullable(): YacsRelationshipBuilder {
    this.config.nullable = true;
    return this;
  }

  public notNullable(): YacsRelationshipBuilder {
    this.config.nullable = false;
    return this;
  }

  public where(conditions: Record<string, any>): YacsRelationshipBuilder {
    this.config.conditions = conditions;
    return this;
  }

  public polymorphicType(typeField: string): YacsRelationshipBuilder {
    this.config.polymorphicType = typeField;
    return this;
  }

  public build(): YacsRelationshipConfig {
    // Set defaults
    if (!this.config.localKey) this.config.localKey = "id";
    if (!this.config.onDelete) this.config.onDelete = YacsCascadeAction.RESTRICT;
    if (!this.config.onUpdate) this.config.onUpdate = YacsCascadeAction.CASCADE;
    if (this.config.nullable === undefined) this.config.nullable = true;

    return this.config as YacsRelationshipConfig;
  }
}

// Relationship helper functions
export function oneToOne(target: string): YacsRelationshipBuilder {
  return new YacsRelationshipBuilder(YacsRelationType.ONE_TO_ONE, target);
}

export function oneToMany(target: string): YacsRelationshipBuilder {
  return new YacsRelationshipBuilder(YacsRelationType.ONE_TO_MANY, target);
}

export function manyToOne(target: string): YacsRelationshipBuilder {
  return new YacsRelationshipBuilder(YacsRelationType.MANY_TO_ONE, target);
}

export function manyToMany(target: string): YacsRelationshipBuilder {
  return new YacsRelationshipBuilder(YacsRelationType.MANY_TO_MANY, target);
}

export function belongsTo(target: string): YacsRelationshipBuilder {
  return new YacsRelationshipBuilder(YacsRelationType.MANY_TO_ONE, target);
}

export function hasOne(target: string): YacsRelationshipBuilder {
  return new YacsRelationshipBuilder(YacsRelationType.ONE_TO_ONE, target);
}

export function hasMany(target: string): YacsRelationshipBuilder {
  return new YacsRelationshipBuilder(YacsRelationType.ONE_TO_MANY, target);
}

export function belongsToMany(target: string): YacsRelationshipBuilder {
  return new YacsRelationshipBuilder(YacsRelationType.MANY_TO_MANY, target);
}

export function selfReference(): YacsRelationshipBuilder {
  return new YacsRelationshipBuilder(YacsRelationType.SELF_REFERENCING, "self");
}

export function morphTo(targets: string[]): YacsRelationshipBuilder {
  // For polymorphic relationships
  return new YacsRelationshipBuilder(YacsRelationType.POLYMORPHIC, targets.join(","));
}

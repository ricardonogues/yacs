import {
  YacsEntityDefinition,
  YacsEntityRelationships,
  YacsRelationshipConfig,
  YacsRelationType,
} from "../types/yacs.types";

export class YacsRelationshipValidator {
  private entities: Map<string, YacsEntityDefinition>;

  constructor(entities: Map<string, YacsEntityDefinition>) {
    this.entities = entities;
  }

  public validateAllRelationships(): YacsValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [entityName, entityDef] of this.entities) {
      if (entityDef.relationships) {
        const result = this.validateEntityRelationships(entityName, entityDef.relationships);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      }
    }

    return { errors, warnings, isValid: errors.length === 0 };
  }

  private validateEntityRelationships(
    entityName: string,
    relationships: YacsEntityRelationships
  ): YacsValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [relationName, config] of Object.entries(relationships)) {
      const result = this.validateRelationship(entityName, relationName, config);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }

    return { errors, warnings, isValid: errors.length === 0 };
  }

  private validateRelationship(
    entityName: string,
    relationName: string,
    config: YacsRelationshipConfig
  ): YacsValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if target entity exists
    if (config.target !== "self" && !this.entities.has(config.target)) {
      errors.push(
        `Entity '${entityName}' has relationship '${relationName}' targeting non-existent entity '${config.target}'`
      );
    }

    // Validate foreign key fields exist
    if (config.foreignKey) {
      const hasField = this.hasField(entityName, config.foreignKey);
      if (!hasField) {
        errors.push(
          `Entity '${entityName}' relationship '${relationName}' references non-existent field '${config.foreignKey}'`
        );
      }
    }

    // Validate many-to-many relationships
    if (config.type === YacsRelationType.MANY_TO_MANY) {
      if (!config.through) {
        warnings.push(`Many-to-many relationship '${entityName}.${relationName}' should specify a 'through' table`);
      }
    }

    // Validate self-referencing relationships
    if (config.type === YacsRelationType.SELF_REFERENCING) {
      if (config.target !== "self" && config.target !== entityName) {
        errors.push(
          `Self-referencing relationship '${entityName}.${relationName}' should target 'self' or '${entityName}'`
        );
      }
    }

    // Check for circular dependencies
    if (this.hasCircularDependency(entityName, config.target, new Set())) {
      warnings.push(`Potential circular dependency detected between '${entityName}' and '${config.target}'`);
    }

    return { errors, warnings, isValid: errors.length === 0 };
  }

  private hasField(entityName: string, fieldName: string): boolean {
    const entity = this.entities.get(entityName);
    return entity ? fieldName in entity.fields : false;
  }

  private hasCircularDependency(fromEntity: string, toEntity: string, visited: Set<string>): boolean {
    if (visited.has(fromEntity)) return true;
    if (toEntity === "self") return false;

    visited.add(fromEntity);

    const entity = this.entities.get(toEntity);
    if (!entity?.relationships) return false;

    for (const config of Object.values(entity.relationships)) {
      if (config.target === fromEntity) return true;
      if (this.hasCircularDependency(toEntity, config.target, new Set(visited))) {
        return true;
      }
    }

    return false;
  }
}

export interface YacsValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

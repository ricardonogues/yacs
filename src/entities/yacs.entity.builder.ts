import { IYacsConnector } from "../connectors/yacs.connector.interface";
import { YacsDrizzleConnector } from "../connectors/yacs.drizzle.connector";
import { serial, timestamp } from "../fields";
import { foreignKey, YacsForeignKeyField } from "../fields/yacs.foreignkey.field";
import { YacsConstraintGenerator } from "../relationships/yacs.constraint.generator";
import { belongsTo } from "../relationships/yacs.relationship.builder";
import { YacsRelationshipEventManager } from "../relationships/yacs.relationship.events";
import { YacsRelationshipValidator, YacsValidationResult } from "../relationships/yacs.relationship.validator";
import {
  YacsConstraint,
  YacsEntity,
  YacsEntityConfig,
  YacsEntityDefinition,
  YacsEntityRelationships,
  YacsEventContext,
  YacsOrm,
  YacsRelationshipConfig,
  YacsRelationshipEvent,
  YacsRelationType,
} from "../types/yacs.types";
import { YacsQueryBuilder } from "./yacs.query.builder";

interface AutoGenerationResult {
  generated: number;
  details: AutoGenerationDetail[];
}

interface AutoGenerationDetail {
  entityName: string;
  fieldName: string;
  relationship: string;
  targetEntity: string;
  type: "foreign_key" | "self_reference" | "pivot_table";
}

export class YacsEntityBuilder {
  private static instance: YacsEntityBuilder;
  private entities: Map<string, YacsEntityDefinition> = new Map();
  private ormInstance: IYacsConnector | null = null;
  private constraintGenerator = new YacsConstraintGenerator();
  private eventManager = new YacsRelationshipEventManager();
  private constraints: YacsConstraint[] = [];
  private relationshipsBuilt: boolean = false;
  private repositories: Map<string, any> = new Map();

  private constructor(private orm: YacsOrm, private databaseUrl?: string) {
    switch (this.orm) {
      case YacsOrm.DRIZZLE:
        this.ormInstance = YacsDrizzleConnector.getInstance(
          this.databaseUrl ? { connectionString: this.databaseUrl } : { connectionString: "" }
        );
        break;
      case YacsOrm.PRISMA:
        throw new Error("Prisma ORM is not yet implemented.");
      default:
        throw new Error(`Unsupported ORM: ${this.orm}`);
    }
  }

  public static getInstance(orm: YacsOrm, databaseUrl?: string): YacsEntityBuilder {
    if (!YacsEntityBuilder.instance) {
      YacsEntityBuilder.instance = new YacsEntityBuilder(orm, databaseUrl);
    }
    return YacsEntityBuilder.instance;
  }

  public buildEntity(
    entityName: string,
    fields: YacsEntityConfig,
    relationships?: YacsEntityRelationships
  ): YacsEntity {
    // Initialize ORM instance if not already done
    if (!this.ormInstance) {
      // This should be injected from the main YACS system
      throw new Error("ORM instance not initialized. This should be set during YACS initialization.");
    }

    // Validate primary keys in field definitions
    const primaryKeyFields = Object.values(fields).filter((field) => field.isPrimaryKeyField);
    if (primaryKeyFields.length === 0) {
      throw new Error(`Entity '${entityName}' requires at least one primary key field.`);
    }
    if (primaryKeyFields.length > 1) {
      throw new Error(`Entity '${entityName}' can only have one primary key field.`);
    }

    // Store entity definition (fields will be enhanced later)
    const entityDef: YacsEntityDefinition = { fields, relationships: relationships || {} };
    this.entities.set(entityName, entityDef);

    console.log(
      `📝 Entity '${entityName}' defined with ${Object.keys(fields).length} fields and ${
        Object.keys(relationships || {}).length
      } relationships`
    );

    // Return entity with placeholder repository (will be built later)
    return {
      name: entityName,
      repository: null, // Will be set after auto-generation
    };
  }

  public buildRelationships(): YacsValidationResult {
    if (this.relationshipsBuilt) {
      console.warn("Relationships have already been built. Skipping...");
      return { isValid: true, errors: [], warnings: [] };
    }

    console.log("🔄 Auto-generating missing foreign key fields...");

    // Step 1: Auto-generate missing foreign key fields
    const generationResult = this.autoGenerateForeignKeys();
    console.log(`✨ Auto-generated ${generationResult.generated} foreign key fields`);

    if (generationResult.generated > 0) {
      generationResult.details.forEach((detail) => {
        console.log(
          `   • Added ${detail.fieldName} to ${detail.entityName} (${detail.relationship} → ${detail.targetEntity})`
        );
      });
    }

    // Step 2: Build repositories now that all fields are complete
    this.buildAllRepositories();

    // Step 3: Validate relationships (should pass now)
    console.log("🔍 Validating relationships...");
    const validator = new YacsRelationshipValidator(this.entities);
    const validationResult = validator.validateAllRelationships();

    // Log validation results
    if (validationResult.errors.length > 0) {
      console.error("❌ Relationship validation failed:");
      validationResult.errors.forEach((error) => console.error(`   • ${error}`));
      throw new Error(`Relationship validation failed: ${validationResult.errors.join(", ")}`);
    }

    if (validationResult.warnings.length > 0) {
      console.warn("⚠️  Relationship validation warnings:");
      validationResult.warnings.forEach((warning) => console.warn(`   • ${warning}`));
    }

    console.log("✅ Relationship validation passed");

    // Step 4: Generate constraints
    this.generateConstraints();
    console.log(`🔗 Generated ${this.constraints.length} database constraints`);

    this.relationshipsBuilt = true;

    return validationResult;
  }

  private autoGenerateForeignKeys(): AutoGenerationResult {
    const result: AutoGenerationResult = {
      generated: 0,
      details: [],
    };

    for (const [entityName, entityDef] of this.entities) {
      if (entityDef.relationships) {
        for (const [relationName, config] of Object.entries(entityDef.relationships)) {
          const generated = this.generateForeignKeyForRelationship(entityName, relationName, config);
          if (generated) {
            result.generated++;
            result.details.push(generated);
          }
        }
      }
    }

    return result;
  }

  private generateForeignKeyForRelationship(
    entityName: string,
    relationName: string,
    config: YacsRelationshipConfig
  ): AutoGenerationDetail | null {
    switch (config.type) {
      case YacsRelationType.MANY_TO_ONE:
        return this.generateManyToOneForeignKey(entityName, relationName, config);

      case YacsRelationType.ONE_TO_ONE:
        return this.generateOneToOneForeignKey(entityName, relationName, config);

      case YacsRelationType.SELF_REFERENCING:
        return this.generateSelfReferencingForeignKey(entityName, relationName, config);

      case YacsRelationType.ONE_TO_MANY:
        // For 1:N, the foreign key goes in the target entity
        return this.generateOneToManyForeignKey(entityName, relationName, config);

      case YacsRelationType.MANY_TO_MANY:
        // For M:N, we might need to create a pivot table
        return this.generateManyToManyPivotTable(entityName, relationName, config);

      default:
        return null;
    }
  }

  private generateManyToOneForeignKey(
    entityName: string,
    relationName: string,
    config: YacsRelationshipConfig
  ): AutoGenerationDetail | null {
    const foreignKeyName = config.foreignKey || `${config.target.toLowerCase()}_id`;
    const entity = this.entities.get(entityName)!;

    // Check if field already exists
    if (foreignKeyName in entity.fields) {
      return null; // Field already exists
    }

    // Auto-generate the foreign key field
    const foreignKeyField = foreignKey(config.target, config.localKey || "id");

    // Apply nullability based on relationship config
    if (config.nullable !== false) {
      foreignKeyField.nullable();
    } else {
      foreignKeyField.notNullable();
    }

    // Add to entity fields
    entity.fields[foreignKeyName] = foreignKeyField;

    return {
      entityName,
      fieldName: foreignKeyName,
      relationship: relationName,
      targetEntity: config.target,
      type: "foreign_key",
    };
  }

  private generateOneToOneForeignKey(
    entityName: string,
    relationName: string,
    config: YacsRelationshipConfig
  ): AutoGenerationDetail | null {
    // For 1:1, check if foreign key is specified to be in this entity
    if (config.foreignKey) {
      const entity = this.entities.get(entityName)!;

      // Check if field already exists
      if (config.foreignKey in entity.fields) {
        return null;
      }

      // Auto-generate the foreign key field
      const foreignKeyField = foreignKey(config.target, config.localKey || "id");
      foreignKeyField.unique(); // 1:1 relationships should be unique

      if (config.nullable !== false) {
        foreignKeyField.nullable();
      } else {
        foreignKeyField.notNullable();
      }

      entity.fields[config.foreignKey] = foreignKeyField;

      return {
        entityName,
        fieldName: config.foreignKey,
        relationship: relationName,
        targetEntity: config.target,
        type: "foreign_key",
      };
    }

    return null; // Foreign key is in the target entity
  }

  private generateSelfReferencingForeignKey(
    entityName: string,
    relationName: string,
    config: YacsRelationshipConfig
  ): AutoGenerationDetail | null {
    const foreignKeyName = config.foreignKey || "parent_id";
    const entity = this.entities.get(entityName)!;

    // Check if field already exists
    if (foreignKeyName in entity.fields) {
      return null;
    }

    // Auto-generate the self-referencing foreign key
    const foreignKeyField = foreignKey(entityName, "id");
    foreignKeyField.nullable(); // Self-referencing is usually optional (root nodes have no parent)

    entity.fields[foreignKeyName] = foreignKeyField;

    return {
      entityName,
      fieldName: foreignKeyName,
      relationship: relationName,
      targetEntity: entityName,
      type: "self_reference",
    };
  }

  private generateOneToManyForeignKey(
    entityName: string,
    relationName: string,
    config: YacsRelationshipConfig
  ): AutoGenerationDetail | null {
    // For 1:N, the foreign key goes in the target entity (many side)
    const foreignKeyName = config.foreignKey || `${entityName.toLowerCase()}_id`;
    const targetEntity = this.entities.get(config.target);

    if (!targetEntity) {
      return null; // Target entity doesn't exist
    }

    // Check if field already exists in target
    if (foreignKeyName in targetEntity.fields) {
      return null;
    }

    // Auto-generate the foreign key in the target entity
    const foreignKeyField = foreignKey(entityName, config.localKey || "id");

    if (config.nullable !== false) {
      foreignKeyField.nullable();
    } else {
      foreignKeyField.notNullable();
    }

    targetEntity.fields[foreignKeyName] = foreignKeyField;

    return {
      entityName: config.target,
      fieldName: foreignKeyName,
      relationship: `reverse_${relationName}`,
      targetEntity: entityName,
      type: "foreign_key",
    };
  }

  private generateManyToManyPivotTable(
    entityName: string,
    relationName: string,
    config: YacsRelationshipConfig
  ): AutoGenerationDetail | null {
    // For M:N, we might auto-create a pivot table if it doesn't exist
    const pivotTableName = config.through || `${entityName.toLowerCase()}_${config.target.toLowerCase()}`;

    // Check if pivot table entity already exists
    if (this.entities.has(pivotTableName)) {
      return null; // Pivot table already exists
    }

    const localKey = config.throughForeignKey || `${entityName.toLowerCase()}_id`;
    const targetKey = config.throughTargetKey || `${config.target.toLowerCase()}_id`;

    // Auto-create pivot table entity
    const pivotFields: YacsEntityConfig = {
      id: serial(),
      [localKey]: foreignKey(entityName).notNullable(),
      [targetKey]: foreignKey(config.target).notNullable(),
      created_at: timestamp().default(new Date()).notNullable(),
    };

    const pivotEntity: YacsEntityDefinition = {
      fields: pivotFields,
      relationships: {
        [entityName.toLowerCase()]: belongsTo(entityName).foreignKey(localKey).build(),
        [config.target.toLowerCase()]: belongsTo(config.target).foreignKey(targetKey).build(),
      },
    };

    this.entities.set(pivotTableName, pivotEntity);

    return {
      entityName: pivotTableName,
      fieldName: `${localKey}, ${targetKey}`,
      relationship: relationName,
      targetEntity: `${entityName} ↔ ${config.target}`,
      type: "pivot_table",
    };
  }

  private buildAllRepositories(): void {
    for (const [entityName, entityDef] of this.entities) {
      const repository = this.buildRepository(entityName, entityDef.fields);
      // Store repository separately
      this.repositories.set(entityName, repository);
      console.log(`🏗️  Built repository for ${entityName}`);
    }
  }

  // Method to get a repository for an entity
  public getRepository(entityName: string): any {
    const repository = this.repositories.get(entityName);
    if (!repository) {
      throw new Error(
        `Repository for entity '${entityName}' not found. Make sure buildRelationships() has been called.`
      );
    }
    return repository;
  }

  // Method to get entity definition with repository
  public getEntity(entityName: string): YacsEntity {
    const entityDef = this.entities.get(entityName);
    const repository = this.repositories.get(entityName);

    if (!entityDef) {
      throw new Error(`Entity '${entityName}' not found.`);
    }

    return {
      name: entityName,
      repository: repository || null,
    };
  }

  private buildRepository(entityName: string, fields: YacsEntityConfig): any {
    if (!this.ormInstance) {
      throw new Error("ORM instance is not initialized.");
    }
    return this.ormInstance.buildEntity(entityName, fields);
  }

  // Enhanced reporting
  public generateRelationshipReport(): string {
    const report: string[] = [];
    report.push("📋 YACS Relationship Report");
    report.push("================================");

    // Entity summary
    report.push(`\n📊 Entities: ${this.entities.size}`);
    for (const [entityName, entityDef] of this.entities) {
      const relationshipCount = Object.keys(entityDef.relationships || {}).length;
      const foreignKeyCount = Object.values(entityDef.fields).filter(
        (field) => field instanceof YacsForeignKeyField
      ).length;

      report.push(
        `   • ${entityName}: ${
          Object.keys(entityDef.fields).length
        } fields (${foreignKeyCount} auto-generated FKs), ${relationshipCount} relationships`
      );
    }

    // Auto-generated fields summary
    const autoFields = this.getAutoGeneratedFields();
    if (autoFields.length > 0) {
      report.push("\n✨ Auto-Generated Foreign Keys:");
      autoFields.forEach(({ entity, field, references }) => {
        report.push(`   • ${entity}.${field} → ${references}`);
      });
    }

    // Constraints summary
    if (this.relationshipsBuilt) {
      report.push(`\n🔗 Generated Constraints: ${this.constraints.length}`);
      const constraintTypes = this.constraints.reduce((acc, constraint) => {
        acc[constraint.type] = (acc[constraint.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(constraintTypes).forEach(([type, count]) => {
        report.push(`   • ${type}: ${count}`);
      });
    }

    return report.join("\n");
  }

  private getAutoGeneratedFields(): { entity: string; field: string; references: string }[] {
    const autoFields: { entity: string; field: string; references: string }[] = [];

    for (const [entityName, entityDef] of this.entities) {
      for (const [fieldName, field] of Object.entries(entityDef.fields)) {
        if (field instanceof YacsForeignKeyField) {
          autoFields.push({
            entity: entityName,
            field: fieldName,
            references: `${field.referencesEntity}.${field.referencesField}`,
          });
        }
      }
    }

    return autoFields;
  }

  private generateConstraints(): void {
    this.constraints = [];

    for (const [entityName, entityDef] of this.entities) {
      if (entityDef.relationships) {
        for (const [relationName, config] of Object.entries(entityDef.relationships)) {
          const relationConstraints = this.constraintGenerator.generateFromRelationship(
            entityName,
            relationName,
            config
          );
          this.constraints.push(...relationConstraints);
        }
      }
    }
  }

  public getConstraints(): YacsConstraint[] {
    return this.constraints;
  }

  public generateMigrationSQL(): string[] {
    return this.constraints.map((constraint) => this.constraintGenerator.generateSQL(constraint));
  }

  // Query builder factory
  public query(entityName: string): YacsQueryBuilder {
    if (!this.entities.has(entityName)) {
      throw new Error(`Entity '${entityName}' not found`);
    }
    return new YacsQueryBuilder(entityName);
  }

  // Event system
  public onRelationshipEvent(
    entity: string,
    relationship: string,
    event: YacsRelationshipEvent,
    handler: (context: YacsEventContext) => Promise<void> | void
  ): void {
    this.eventManager.on(entity, relationship, event, handler);
  }

  public onGlobalRelationshipEvent(
    event: YacsRelationshipEvent,
    handler: (context: YacsEventContext) => Promise<void> | void
  ): void {
    this.eventManager.onGlobal(event, handler);
  }

  public getAllEntities(): Map<string, YacsEntityDefinition> {
    return this.entities;
  }
}

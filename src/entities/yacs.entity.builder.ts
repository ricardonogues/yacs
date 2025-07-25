import { IYacsConnector } from "../connectors/yacs.connector.interface";
import { YacsDrizzleConnector } from "../connectors/yacs.drizzle.connector";
import { YacsConstraintGenerator } from "../relationships/yacs.constraint.generator";
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

export class YacsEntityBuilder {
  private static instance: YacsEntityBuilder;
  private entities: Map<string, YacsEntityDefinition> = new Map();
  private ormInstance: IYacsConnector | null = null;
  private constraintGenerator = new YacsConstraintGenerator();
  private eventManager = new YacsRelationshipEventManager();
  private constraints: YacsConstraint[] = [];

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
    // Store entity definition
    const entityDef: YacsEntityDefinition = { fields, relationships: relationships || {} };
    this.entities.set(entityName, entityDef);

    // Build repository
    const repository = this.buildRepository(entityName, fields);

    return { name: entityName, repository };
  }

  public buildRelationships(): YacsValidationResult {
    // Validate relationships
    const validator = new YacsRelationshipValidator(this.entities);
    const validationResult = validator.validateAllRelationships();

    if (!validationResult.isValid) {
      console.error("Relationship validation failed:", validationResult.errors);
      throw new Error(`Relationship validation failed: ${validationResult.errors.join(", ")}`);
    }

    // Generate constraints
    this.generateConstraints();

    // Log validation results
    if (validationResult.warnings.length > 0) {
      console.warn("Relationship warnings:", validationResult.warnings);
    }

    return validationResult;
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

  private buildRepository(entityName: string, fields: YacsEntityConfig): any {
    // Implementation depends on ORM
    return {};
  }

  // public buildRelationships(): void {
  //   // Process all relationships after all entities are defined
  //   for (const [entityName, entityDef] of this.entities) {
  //     if (entityDef.relationships) {
  //       this.processEntityRelationships(entityName, entityDef.relationships);
  //     }
  //   }
  // }

  // private processEntityRelationships(entityName: string, relationships: YacsEntityRelationships): void {
  //   for (const [relationName, relationConfig] of Object.entries(relationships)) {
  //     this.createRelationship(entityName, relationName, relationConfig);
  //   }
  // }

  // private createRelationship(entityName: string, relationName: string, config: YacsRelationshipConfig): void {
  //   console.log(`Creating relationship: ${entityName}.${relationName} -> ${config.target}`);

  //   switch (config.type) {
  //     case YacsRelationType.ONE_TO_ONE:
  //       this.createOneToOne(entityName, relationName, config);
  //       break;
  //     case YacsRelationType.ONE_TO_MANY:
  //       this.createOneToMany(entityName, relationName, config);
  //       break;
  //     case YacsRelationType.MANY_TO_ONE:
  //       this.createManyToOne(entityName, relationName, config);
  //       break;
  //     case YacsRelationType.MANY_TO_MANY:
  //       this.createManyToMany(entityName, relationName, config);
  //       break;
  //     case YacsRelationType.SELF_REFERENCING:
  //       this.createSelfReferencing(entityName, relationName, config);
  //       break;
  //     case YacsRelationType.POLYMORPHIC:
  //       this.createPolymorphic(entityName, relationName, config);
  //       break;
  //   }
  // }

  // private createOneToOne(entityName: string, relationName: string, config: YacsRelationshipConfig): void {
  //   // Implementation for 1:1 relationships
  //   const foreignKey = config.foreignKey || `${config.target.toLowerCase()}_id`;
  //   console.log(`1:1 relationship: ${entityName} -> ${config.target} via ${foreignKey}`);
  // }

  // private createOneToMany(entityName: string, relationName: string, config: YacsRelationshipConfig): void {
  //   // Implementation for 1:N relationships
  //   const foreignKey = config.foreignKey || `${entityName.toLowerCase()}_id`;
  //   console.log(`1:N relationship: ${entityName} -> ${config.target} via ${foreignKey}`);
  // }

  // private createManyToOne(entityName: string, relationName: string, config: YacsRelationshipConfig): void {
  //   // Implementation for N:1 relationships
  //   const foreignKey = config.foreignKey || `${config.target.toLowerCase()}_id`;
  //   console.log(`N:1 relationship: ${entityName} -> ${config.target} via ${foreignKey}`);
  // }

  // private createManyToMany(entityName: string, relationName: string, config: YacsRelationshipConfig): void {
  //   // Implementation for N:N relationships
  //   const pivotTable = config.through || `${entityName.toLowerCase()}_${config.target.toLowerCase()}`;
  //   const localKey = config.throughForeignKey || `${entityName.toLowerCase()}_id`;
  //   const targetKey = config.throughTargetKey || `${config.target.toLowerCase()}_id`;
  //   console.log(`N:N relationship: ${entityName} <-> ${config.target} via ${pivotTable}(${localKey}, ${targetKey})`);
  // }

  // private createSelfReferencing(entityName: string, relationName: string, config: YacsRelationshipConfig): void {
  //   // Implementation for self-referencing relationships
  //   const foreignKey = config.foreignKey || "parent_id";
  //   console.log(`Self-referencing: ${entityName} -> ${entityName} via ${foreignKey}`);
  // }

  // private createPolymorphic(entityName: string, relationName: string, config: YacsRelationshipConfig): void {
  //   // Implementation for polymorphic relationships
  //   const morphId = `${relationName}_id`;
  //   const morphType = `${relationName}_type`;
  //   console.log(`Polymorphic: ${entityName} -> ${config.target} via ${morphId}, ${morphType}`);
  // }

  public getEntity(name: string): YacsEntityDefinition | undefined {
    return this.entities.get(name);
  }

  public getAllEntities(): Map<string, YacsEntityDefinition> {
    return this.entities;
  }
}

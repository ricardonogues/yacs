import { IYacsConnector } from "../connectors/yacs.connector.interface";
import { YacsDrizzleConnector } from "../connectors/yacs.drizzle.connector";
import {
  YacsEntity,
  YacsEntityConfig,
  YacsEntityDefinition,
  YacsEntityRelationships,
  YacsOrm,
  YacsRelationshipConfig,
  YacsRelationType,
} from "../types/yacs.types";

export class YacsEntityBuilder {
  private static instance: YacsEntityBuilder;
  private entities: Map<string, YacsEntityDefinition> = new Map();
  private ormInstance: IYacsConnector | null = null;

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
    if (!this.ormInstance) {
      throw new Error("ORM instance is not initialized.");
    }

    // Validate primary keys
    const primaryKeyFields = Object.values(fields).filter((field) => field.isPrimaryKeyField);
    if (primaryKeyFields.length === 0) {
      throw new Error("At least one primary key field is required.");
    }
    if (primaryKeyFields.length > 1) {
      throw new Error("Only one primary key field is allowed.");
    }

    // Store entity definition
    const entityDef: YacsEntityDefinition = {
      fields,
      relationships: relationships || {},
    };
    this.entities.set(entityName, entityDef);

    // Build the entity with ORM
    const repository = this.ormInstance.buildEntity(entityName, fields);

    const entityConfig: YacsEntity = {
      name: entityName,
      repository,
    };

    return entityConfig;
  }

  public buildRelationships(): void {
    // Process all relationships after all entities are defined
    for (const [entityName, entityDef] of this.entities) {
      if (entityDef.relationships) {
        this.processEntityRelationships(entityName, entityDef.relationships);
      }
    }
  }

  private processEntityRelationships(entityName: string, relationships: YacsEntityRelationships): void {
    for (const [relationName, relationConfig] of Object.entries(relationships)) {
      this.createRelationship(entityName, relationName, relationConfig);
    }
  }

  private createRelationship(entityName: string, relationName: string, config: YacsRelationshipConfig): void {
    console.log(`Creating relationship: ${entityName}.${relationName} -> ${config.target}`);

    switch (config.type) {
      case YacsRelationType.ONE_TO_ONE:
        this.createOneToOne(entityName, relationName, config);
        break;
      case YacsRelationType.ONE_TO_MANY:
        this.createOneToMany(entityName, relationName, config);
        break;
      case YacsRelationType.MANY_TO_ONE:
        this.createManyToOne(entityName, relationName, config);
        break;
      case YacsRelationType.MANY_TO_MANY:
        this.createManyToMany(entityName, relationName, config);
        break;
      case YacsRelationType.SELF_REFERENCING:
        this.createSelfReferencing(entityName, relationName, config);
        break;
      case YacsRelationType.POLYMORPHIC:
        this.createPolymorphic(entityName, relationName, config);
        break;
    }
  }

  private createOneToOne(entityName: string, relationName: string, config: YacsRelationshipConfig): void {
    // Implementation for 1:1 relationships
    const foreignKey = config.foreignKey || `${config.target.toLowerCase()}_id`;
    console.log(`1:1 relationship: ${entityName} -> ${config.target} via ${foreignKey}`);
  }

  private createOneToMany(entityName: string, relationName: string, config: YacsRelationshipConfig): void {
    // Implementation for 1:N relationships
    const foreignKey = config.foreignKey || `${entityName.toLowerCase()}_id`;
    console.log(`1:N relationship: ${entityName} -> ${config.target} via ${foreignKey}`);
  }

  private createManyToOne(entityName: string, relationName: string, config: YacsRelationshipConfig): void {
    // Implementation for N:1 relationships
    const foreignKey = config.foreignKey || `${config.target.toLowerCase()}_id`;
    console.log(`N:1 relationship: ${entityName} -> ${config.target} via ${foreignKey}`);
  }

  private createManyToMany(entityName: string, relationName: string, config: YacsRelationshipConfig): void {
    // Implementation for N:N relationships
    const pivotTable = config.through || `${entityName.toLowerCase()}_${config.target.toLowerCase()}`;
    const localKey = config.throughForeignKey || `${entityName.toLowerCase()}_id`;
    const targetKey = config.throughTargetKey || `${config.target.toLowerCase()}_id`;
    console.log(`N:N relationship: ${entityName} <-> ${config.target} via ${pivotTable}(${localKey}, ${targetKey})`);
  }

  private createSelfReferencing(entityName: string, relationName: string, config: YacsRelationshipConfig): void {
    // Implementation for self-referencing relationships
    const foreignKey = config.foreignKey || "parent_id";
    console.log(`Self-referencing: ${entityName} -> ${entityName} via ${foreignKey}`);
  }

  private createPolymorphic(entityName: string, relationName: string, config: YacsRelationshipConfig): void {
    // Implementation for polymorphic relationships
    const morphId = `${relationName}_id`;
    const morphType = `${relationName}_type`;
    console.log(`Polymorphic: ${entityName} -> ${config.target} via ${morphId}, ${morphType}`);
  }

  public getEntity(name: string): YacsEntityDefinition | undefined {
    return this.entities.get(name);
  }

  public getAllEntities(): Map<string, YacsEntityDefinition> {
    return this.entities;
  }
}

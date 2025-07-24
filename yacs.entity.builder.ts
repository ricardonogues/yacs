import { IYacsConnector } from "./connectors/yacs.connector.interface";
import { YacsDrizzleConnector } from "./connectors/yacs.drizzle.connector";
import { YacsEntity, YacsEntityConfig, YacsOrm } from "./yacs.types";

export class YacsEntityBuilder {
  private static instance: YacsEntityBuilder;
  private ormInstance: IYacsConnector | null = null;

  private constructor(private orm: YacsOrm, private databaseUrl?: string) {
    // Private constructor to prevent instantiation
    switch (this.orm) {
      case YacsOrm.DRIZZLE:
        this.ormInstance = YacsDrizzleConnector.getInstance(
          this.databaseUrl ? { connectionString: this.databaseUrl } : { connectionString: "" }
        );
        break;
      case YacsOrm.PRISMA:
        // Initialize Prisma connector here if needed
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

  public buildEntity(entityName: string, entity: YacsEntityConfig): YacsEntity {
    if (!this.ormInstance) {
      throw new Error("ORM instance is not initialized.");
    }

    const primaryKeyFields = Object.values(entity).filter((field) => field.isPrimaryKeyField);

    if (primaryKeyFields.length === 0) {
      throw new Error("At least one primary key field is required.");
    }

    if (primaryKeyFields.length > 1) {
      throw new Error("Only one primary key field is allowed.");
    }

    const entityConfig: YacsEntity = {
      name: entityName,
      repository: this.ormInstance?.buildEntity(entityName, entity),
    };

    // Logic to build the entity can go here
    return entityConfig;
  }
}

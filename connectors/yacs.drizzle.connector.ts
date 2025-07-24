import { drizzle } from "drizzle-orm/node-postgres";
import { YacsConnectionOptions, IYacsConnector } from "./yacs.connector.interface";
import { YacsEntityConfig, YacsFieldType } from "../yacs.types";
import { YacsField } from "../fields/yacs.field";
import { integer, pgTable } from "drizzle-orm/pg-core";

export class YacsDrizzleConnector implements IYacsConnector {
  private static instance: YacsDrizzleConnector;
  private db: ReturnType<typeof drizzle>;

  private constructor(private options: YacsConnectionOptions) {
    this.db = drizzle({
      connection: {
        connectionString: options.connectionString,
        ssl: options.ssl ? { rejectUnauthorized: false } : undefined,
      },
    });
  }

  public static getInstance(options: YacsConnectionOptions): YacsDrizzleConnector {
    if (!YacsDrizzleConnector.instance) {
      YacsDrizzleConnector.instance = new YacsDrizzleConnector(options);
    }
    return YacsDrizzleConnector.instance;
  }

  public connect(): void {
    console.log("Connecting to Drizzle ORM...");
  }

  public buildEntity(entityName: string, entity: YacsEntityConfig): any {
    console.log("Building entity with Drizzle ORM:", entity);
    const fields: Record<string, any> = {};
    Object.entries(entity).forEach(([fieldName, fieldConfig]) => {
      let field: any;

      field = this.getFieldType(fieldConfig);

      if (fieldConfig.isPrimaryKeyField) {
        field = field.primaryKey();
      }

      if (fieldConfig.isNullableField) {
        field = field.nullable();

        if (fieldConfig.defaultTypeValue !== undefined) {
          field = field.default(fieldConfig.defaultTypeValue);
        }
      } else if (fieldConfig.isUniqueField) {
        field = field.unique();
      }

      return {
        ...fields,
        [fieldName]: field,
      };
    });
    return pgTable(entityName, fields);
  }

  private getFieldType(field: YacsField): any {
    switch (field.type) {
      case YacsFieldType.INTEGER:
        return integer();
      case YacsFieldType.STRING:
        return "string"; // Replace with actual string type definition
      case YacsFieldType.BOOLEAN:
        return "boolean"; // Replace with actual boolean type definition
      case YacsFieldType.DATE:
        return "date"; // Replace with actual date type definition
      case YacsFieldType.JSON:
        return "json"; // Replace with actual JSON type definition
      default:
        throw new Error(`Unsupported field type: ${field.type}`);
    }
  }
}

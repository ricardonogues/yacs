import { drizzle } from "drizzle-orm/node-postgres";
import { YacsConnectionOptions, IYacsConnector } from "./yacs.connector.interface";
import { YacsEntityConfig, YacsFieldType } from "../types/yacs.types";
import { YacsField } from "../fields/yacs.field";
import {
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  date,
  json,
  serial,
  decimal,
  real,
  uuid as drizzleUuid,
  bigint as drizzleBigint,
  bigserial,
  time,
  interval,
  point,
  geometry,
  inet as drizzleInet,
  pgTable,
} from "drizzle-orm/pg-core";
import { YacsIntegerField } from "../fields/yacs.integer.field";
import { YacsBigIntField } from "../fields/yacs.bigint.field";
import { YacsDecimalField } from "../fields/yacs.decimal.field";
import { YacsStringField } from "../fields/yacs.string.field";
import { YacsDateField } from "../fields/yacs.date.field";
import { YacsTimeField } from "../fields/yacs.time.field";
import { YacsGeometryField } from "../fields/yacs.geometry.field";
import { YacsInetField } from "../fields/yacs.inet.field";
import { YacsRangeField } from "../fields/yacs.range.field";
import { YacsEnumField } from "../fields/yacs.enum.field";
import { YacsArrayField } from "../fields/yacs.array.field";

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
        const intField = field as YacsIntegerField;
        if (intField.isAutoIncrementField) {
          return serial();
        }
        return integer();

      case YacsFieldType.BIGINT:
        const bigintField = field as YacsBigIntField;
        if (bigintField.isAutoIncrementField) {
          return bigserial({ mode: "number" });
        }
        return drizzleBigint({ mode: "number" });

      case YacsFieldType.DECIMAL:
        const decimalField = field as YacsDecimalField;
        if (decimalField.precisionValue && decimalField.scaleValue) {
          return decimal({
            precision: decimalField.precisionValue,
            scale: decimalField.scaleValue,
          });
        }
        return decimal();

      case YacsFieldType.FLOAT:
        return real();

      case YacsFieldType.STRING:
        const stringField = field as YacsStringField;
        if (stringField.maxLengthValue) {
          return varchar({ length: stringField.maxLengthValue });
        }
        return text();

      case YacsFieldType.TEXT:
        return text();

      case YacsFieldType.EMAIL:
        return varchar({ length: 255 });

      case YacsFieldType.URL:
        return varchar({ length: 2048 });

      case YacsFieldType.UUID:
        return drizzleUuid();

      case YacsFieldType.BOOLEAN:
        return boolean();

      case YacsFieldType.DATE:
        const dateField = field as YacsDateField;
        if (dateField.includesTime) {
          return timestamp();
        }
        return date();

      case YacsFieldType.TIME:
        const timeField = field as YacsTimeField;
        return time({ withTimezone: timeField.includesTimezone });

      case YacsFieldType.INTERVAL:
        return interval();

      case YacsFieldType.JSON:
        return json();

      case YacsFieldType.POINT:
        return point();

      case YacsFieldType.GEOMETRY:
        const geomField = field as YacsGeometryField;
        if (geomField.geomType) {
          return geometry({ type: geomField.geomType, srid: geomField.spatialReference });
        }
        return geometry();

      case YacsFieldType.INET:
        const inetField = field as YacsInetField;
        return drizzleInet();

      case YacsFieldType.RANGE:
        const rangeField = field as YacsRangeField;
        // Note: Drizzle might not have native range support yet
        // This would need custom implementation
        return text(); // Fallback to text for now

      case YacsFieldType.ENUM:
        const enumField = field as YacsEnumField;
        // Note: Enum creation would need to be handled separately
        return varchar({ length: 50 });

      case YacsFieldType.ARRAY:
        const arrayField = field as YacsArrayField;
        // PostgreSQL arrays - would need proper array type implementation
        return json(); // Fallback to JSON

      case YacsFieldType.BINARY:
        // PostgreSQL bytea - might need custom implementation
        return text(); // Fallback for now

      default:
        throw new Error(`Unsupported field type: ${field.type}`);
    }
  }
}

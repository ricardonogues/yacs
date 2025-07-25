import { drizzle } from "drizzle-orm/node-postgres";
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

import { YacsConnectionOptions, IYacsConnector } from "./yacs.connector.interface";
import { YacsEntityConfig, YacsFieldType } from "../types/yacs.types";
import { YacsField } from "../fields/yacs.field";
import { YacsStringField } from "../fields/yacs.string.field";
import { YacsDateField } from "../fields/yacs.date.field";
import { YacsIntegerField } from "../fields/yacs.integer.field";
import { YacsDecimalField } from "../fields/yacs.decimal.field";
import { YacsTimeField } from "../fields/yacs.time.field";
import { YacsGeometryField } from "../fields/yacs.geometry.field";
import { YacsInetField } from "../fields/yacs.inet.field";
import { YacsRangeField } from "../fields/yacs.range.field";
import { YacsEnumField } from "../fields/yacs.enum.field";
import { YacsArrayField } from "../fields/yacs.array.field";
import { YacsBigIntField } from "../fields";

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
    console.log("Building entity with Drizzle ORM:", entityName);
    const fields: Record<string, any> = {};

    Object.entries(entity).forEach(([fieldName, fieldConfig]) => {
      let field = this.getFieldType(fieldConfig);

      // Apply field modifiers in the correct order
      // 1. Primary key
      if (fieldConfig.isPrimaryKeyField) {
        field = field.primaryKey();
      }

      // 2. Unique constraint
      if (fieldConfig.isUniqueField) {
        field = field.unique();
      }

      // 3. Nullable/NotNull - FIXED: In Drizzle, fields are nullable by default
      // Only add .notNull() if the field should NOT be nullable
      if (!fieldConfig.isNullableField) {
        field = field.notNull();
      }
      // If isNullableField is true, we don't need to do anything since Drizzle columns are nullable by default

      // 4. Default value
      if (fieldConfig.defaultTypeValue !== undefined) {
        field = field.default(fieldConfig.defaultTypeValue);
      }

      fields[fieldName] = field;
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
        return drizzleInet();

      case YacsFieldType.RANGE:
        // PostgreSQL ranges - Drizzle might not have native support yet
        // For now, we'll use text as a fallback and handle serialization in the app
        return text();

      case YacsFieldType.ENUM:
        // For enums, we need to create the enum type first
        // For now, we'll use varchar as a fallback
        const enumField = field as YacsEnumField;
        const maxLength = Math.max(...enumField.allowedValues.map((v) => v.length));
        return varchar({ length: Math.max(maxLength, 50) });

      case YacsFieldType.ARRAY:
        // PostgreSQL arrays - for now we'll use JSON as a fallback
        // In production, you might want to use proper array types
        return json();

      case YacsFieldType.BINARY:
        // PostgreSQL bytea - Drizzle might not have direct support
        // Use text for now and handle binary encoding in the app
        return text();

      default:
        throw new Error(`Unsupported field type: ${field.type}`);
    }
  }
}

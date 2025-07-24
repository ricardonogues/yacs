import { YacsField } from "../fields/yacs.field";

export enum YacsOrm {
  DRIZZLE = "drizzle",
  PRISMA = "prisma",
}

export type YacsOptions = {
  // Define the options for YacsSystem here
  orm?: YacsOrm;
  databaseUrl?: string;
};

export type YacsEntityConfig = {
  // Define the configuration for YacsEntity here
  [key: string]: YacsField;
};

export type YacsEntity = {
  name: string; // The name of the entity
  repository: any; // The repository name for the entity
};

export enum YacsFieldType {
  STRING = "string",
  INTEGER = "integer",
  BOOLEAN = "boolean",
  DATE = "date",
  JSON = "json",
  DECIMAL = "decimal",
  FLOAT = "float",
  UUID = "uuid",
  EMAIL = "email",
  URL = "url",
  ENUM = "enum",
  TEXT = "text",
  BIGINT = "bigint",
  BINARY = "binary",
  ARRAY = "array",
  TIME = "time",
  INTERVAL = "interval",
  POINT = "point",
  GEOMETRY = "geometry",
  INET = "inet",
  RANGE = "range",
}

export enum YacsRelationType {
  ONE_TO_ONE = "oneToOne",
  ONE_TO_MANY = "oneToMany",
  MANY_TO_ONE = "manyToOne",
  MANY_TO_MANY = "manyToMany",
  SELF_REFERENCING = "selfReferencing",
  POLYMORPHIC = "polymorphic",
}

export enum YacsCascadeAction {
  CASCADE = "CASCADE",
  SET_NULL = "SET NULL",
  SET_DEFAULT = "SET DEFAULT",
  RESTRICT = "RESTRICT",
  NO_ACTION = "NO ACTION",
}

export interface YacsRelationshipConfig {
  type: YacsRelationType;
  target: string; // Target entity name
  foreignKey?: string; // Foreign key field name
  localKey?: string; // Local key field name (defaults to 'id')
  through?: string; // Junction/pivot table name for M:N
  throughForeignKey?: string; // Foreign key in junction table pointing to this entity
  throughTargetKey?: string; // Foreign key in junction table pointing to target entity
  onDelete?: YacsCascadeAction;
  onUpdate?: YacsCascadeAction;
  nullable?: boolean;
  conditions?: Record<string, any>; // WHERE conditions for the relationship
  polymorphicType?: string; // For polymorphic relationships
}

export interface YacsEntityRelationships {
  [relationshipName: string]: YacsRelationshipConfig;
}

export interface YacsEntityDefinition {
  fields: YacsEntityConfig;
  relationships?: YacsEntityRelationships;
}

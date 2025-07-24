import { YacsField } from "./fields/yacs.field";

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
}

import { YacsEntity, YacsEntityConfig } from "../yacs.types";

export type YacsConnectionOptions = {
  connectionString: string;
  ssl?: boolean;
};

export interface IYacsConnector {
  connect(options: YacsConnectionOptions): void;
  buildEntity(entityName: string, entity: YacsEntityConfig): any;
}

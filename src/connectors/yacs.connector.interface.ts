import { YacsEntity, YacsEntityConfig } from "../types/yacs.types";

export type YacsConnectionOptions = {
  connectionString: string;
  ssl?: boolean;
};

export interface IYacsConnector {
  connect(options: YacsConnectionOptions): void;
  buildEntity(entityName: string, entity: YacsEntityConfig): any;
}

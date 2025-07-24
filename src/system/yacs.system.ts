import { YacsEntityBuilder } from "../entities/yacs.entity.builder";
import { YacsOptions, YacsOrm } from "../types/yacs.types";

class YacsSystem {
  private static instance: YacsSystem;

  private constructor(private options: YacsOptions) {
    // Private constructor to prevent instantiation
  }

  public static getInstance(options: YacsOptions): YacsSystem {
    if (!YacsSystem.instance) {
      YacsSystem.instance = new YacsSystem(options);
    }
    return YacsSystem.instance;
  }

  public initialize(): { entityBuilder: YacsEntityBuilder } {
    const yacsEntityBuilder = YacsEntityBuilder.getInstance(
      this.options.orm || YacsOrm.DRIZZLE,
      this.options.databaseUrl
    );
    return {
      entityBuilder: yacsEntityBuilder,
    };
  }
}

export function yacs(options: YacsOptions): { entityBuilder: YacsEntityBuilder } {
  const yacsSystem = YacsSystem.getInstance(options);
  return yacsSystem.initialize();
}

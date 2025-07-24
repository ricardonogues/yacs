import { integer } from "./fields/yacs.integer.field";
import { yacs } from "./yacs.system";
import { YacsOrm } from "./yacs.types";

const { entityBuilder } = yacs({
  orm: YacsOrm.DRIZZLE, // or "PRISMA"
  databaseUrl: process.env.DATABASE_URL, // Optional, if not provided it will default to an empty string
});

const user = entityBuilder.buildEntity("User", {
  id: integer().primaryKey().notNullable(),
});

export class YacsQueryBuilder {
  private entity: string;
  private selectFields: string[] = ["*"];
  private whereConditions: Record<string, any> = {};
  private orderByFields: Record<string, "asc" | "desc"> = {};
  private limitValue?: number;
  private offsetValue?: number;
  private eagerLoadRelations: string[] = [];
  private joinedRelations: Map<string, YacsJoinConfig> = new Map();

  constructor(entity: string) {
    this.entity = entity;
  }

  public select(...fields: string[]): YacsQueryBuilder {
    this.selectFields = fields;
    return this;
  }

  public where(field: string, operator: string, value: any): YacsQueryBuilder;
  public where(conditions: Record<string, any>): YacsQueryBuilder;
  public where(fieldOrConditions: string | Record<string, any>, operator?: string, value?: any): YacsQueryBuilder {
    if (typeof fieldOrConditions === "string") {
      this.whereConditions[fieldOrConditions] = { operator: operator || "=", value };
    } else {
      Object.assign(this.whereConditions, fieldOrConditions);
    }
    return this;
  }

  public orderBy(field: string, direction: "asc" | "desc" = "asc"): YacsQueryBuilder {
    this.orderByFields[field] = direction;
    return this;
  }

  public limit(count: number): YacsQueryBuilder {
    this.limitValue = count;
    return this;
  }

  public offset(count: number): YacsQueryBuilder {
    this.offsetValue = count;
    return this;
  }

  // Eager loading - load relationships in the same query
  public with(...relations: string[]): YacsQueryBuilder {
    this.eagerLoadRelations.push(...relations);
    return this;
  }

  // Manual joins for complex queries
  public join(relation: string, type: "inner" | "left" | "right" = "inner"): YacsQueryBuilder {
    this.joinedRelations.set(relation, { type, relation });
    return this;
  }

  public leftJoin(relation: string): YacsQueryBuilder {
    return this.join(relation, "left");
  }

  public rightJoin(relation: string): YacsQueryBuilder {
    return this.join(relation, "right");
  }

  // Relationship-specific queries
  public whereHas(relation: string, callback?: (query: YacsQueryBuilder) => void): YacsQueryBuilder {
    // Query entities that have related records
    const subQuery = new YacsQueryBuilder(relation);
    if (callback) callback(subQuery);

    // This would be implemented based on the ORM
    console.log(`Adding whereHas constraint for ${relation}`);
    return this;
  }

  public whereDoesntHave(relation: string): YacsQueryBuilder {
    // Query entities that don't have related records
    console.log(`Adding whereDoesntHave constraint for ${relation}`);
    return this;
  }

  public withCount(...relations: string[]): YacsQueryBuilder {
    // Add count of related records to results
    relations.forEach((relation) => {
      this.selectFields.push(`${relation}_count`);
    });
    return this;
  }

  // Execute queries
  public async get(): Promise<any[]> {
    const query = this.buildQuery();
    console.log("Executing query:", query);
    // Implementation would depend on the ORM
    return [];
  }

  public async first(): Promise<any | null> {
    const results = await this.limit(1).get();
    return results.length > 0 ? results[0] : null;
  }

  public async find(id: any): Promise<any | null> {
    return await this.where("id", "=", id).first();
  }

  public async count(): Promise<number> {
    const query = this.buildCountQuery();
    console.log("Executing count query:", query);
    return 0;
  }

  public async paginate(page: number, perPage: number = 15): Promise<YacsPaginationResult> {
    const total = await this.count();
    const offset = (page - 1) * perPage;
    const data = await this.limit(perPage).offset(offset).get();

    return {
      data,
      total,
      page,
      perPage,
      lastPage: Math.ceil(total / perPage),
      hasNextPage: page < Math.ceil(total / perPage),
      hasPrevPage: page > 1,
    };
  }

  private buildQuery(): string {
    // This would generate the actual SQL/ORM query
    let sql = `SELECT ${this.selectFields.join(", ")} FROM ${this.entity}`;

    // Add joins for eager loading
    for (const relation of this.eagerLoadRelations) {
      sql += ` LEFT JOIN ${relation} ON ...`; // Relationship-specific join logic
    }

    // Add WHERE clauses
    if (Object.keys(this.whereConditions).length > 0) {
      const conditions = Object.entries(this.whereConditions).map(([field, condition]) => {
        if (typeof condition === "object" && condition.operator) {
          return `${field} ${condition.operator} ${this.formatValue(condition.value)}`;
        }
        return `${field} = ${this.formatValue(condition)}`;
      });
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    // Add ORDER BY
    if (Object.keys(this.orderByFields).length > 0) {
      const orderClauses = Object.entries(this.orderByFields).map(
        ([field, direction]) => `${field} ${direction.toUpperCase()}`
      );
      sql += ` ORDER BY ${orderClauses.join(", ")}`;
    }

    // Add LIMIT and OFFSET
    if (this.limitValue) sql += ` LIMIT ${this.limitValue}`;
    if (this.offsetValue) sql += ` OFFSET ${this.offsetValue}`;

    return sql;
  }

  private buildCountQuery(): string {
    return `SELECT COUNT(*) FROM ${this.entity}`;
  }

  private formatValue(value: any): string {
    if (typeof value === "string") return `'${value}'`;
    if (value === null) return "NULL";
    return String(value);
  }
}

interface YacsJoinConfig {
  type: "inner" | "left" | "right";
  relation: string;
}

interface YacsPaginationResult {
  data: any[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

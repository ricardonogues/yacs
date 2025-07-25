import {
  YacsCascadeAction,
  YacsConstraint,
  YacsConstraintType,
  YacsRelationshipConfig,
  YacsRelationType,
} from "../types/yacs.types";

export class YacsConstraintGenerator {
  private constraints: YacsConstraint[] = [];

  public generateFromRelationship(
    entityName: string,
    relationName: string,
    config: YacsRelationshipConfig
  ): YacsConstraint[] {
    const constraints: YacsConstraint[] = [];

    switch (config.type) {
      case YacsRelationType.ONE_TO_ONE:
        constraints.push(...this.generateOneToOneConstraints(entityName, relationName, config));
        break;
      case YacsRelationType.MANY_TO_ONE:
        constraints.push(...this.generateManyToOneConstraints(entityName, relationName, config));
        break;
      case YacsRelationType.MANY_TO_MANY:
        constraints.push(...this.generateManyToManyConstraints(entityName, relationName, config));
        break;
      case YacsRelationType.SELF_REFERENCING:
        constraints.push(...this.generateSelfReferencingConstraints(entityName, relationName, config));
        break;
    }

    return constraints;
  }

  private generateOneToOneConstraints(
    entityName: string,
    relationName: string,
    config: YacsRelationshipConfig
  ): YacsConstraint[] {
    const foreignKey = config.foreignKey || `${config.target.toLowerCase()}_id`;
    const constraintName = `fk_${entityName.toLowerCase()}_${foreignKey}`;

    return [
      {
        name: constraintName,
        type: YacsConstraintType.FOREIGN_KEY,
        table: entityName,
        columns: [foreignKey],
        referencedTable: config.target,
        referencedColumns: [config.localKey || "id"],
        onDelete: config.onDelete,
        onUpdate: config.onUpdate,
      },
    ];
  }

  private generateManyToOneConstraints(
    entityName: string,
    relationName: string,
    config: YacsRelationshipConfig
  ): YacsConstraint[] {
    const foreignKey = config.foreignKey || `${config.target.toLowerCase()}_id`;
    const constraintName = `fk_${entityName.toLowerCase()}_${foreignKey}`;

    return [
      {
        name: constraintName,
        type: YacsConstraintType.FOREIGN_KEY,
        table: entityName,
        columns: [foreignKey],
        referencedTable: config.target,
        referencedColumns: [config.localKey || "id"],
        onDelete: config.onDelete,
        onUpdate: config.onUpdate,
      },
    ];
  }

  private generateManyToManyConstraints(
    entityName: string,
    relationName: string,
    config: YacsRelationshipConfig
  ): YacsConstraint[] {
    const pivotTable = config.through || `${entityName.toLowerCase()}_${config.target.toLowerCase()}`;
    const localKey = config.throughForeignKey || `${entityName.toLowerCase()}_id`;
    const targetKey = config.throughTargetKey || `${config.target.toLowerCase()}_id`;

    return [
      // First foreign key constraint
      {
        name: `fk_${pivotTable}_${localKey}`,
        type: YacsConstraintType.FOREIGN_KEY,
        table: pivotTable,
        columns: [localKey],
        referencedTable: entityName,
        referencedColumns: ["id"],
        onDelete: YacsCascadeAction.CASCADE,
        onUpdate: YacsCascadeAction.CASCADE,
      },
      // Second foreign key constraint
      {
        name: `fk_${pivotTable}_${targetKey}`,
        type: YacsConstraintType.FOREIGN_KEY,
        table: pivotTable,
        columns: [targetKey],
        referencedTable: config.target,
        referencedColumns: ["id"],
        onDelete: YacsCascadeAction.CASCADE,
        onUpdate: YacsCascadeAction.CASCADE,
      },
      // Unique constraint to prevent duplicates
      {
        name: `uk_${pivotTable}_${localKey}_${targetKey}`,
        type: YacsConstraintType.UNIQUE,
        table: pivotTable,
        columns: [localKey, targetKey],
      },
    ];
  }

  private generateSelfReferencingConstraints(
    entityName: string,
    relationName: string,
    config: YacsRelationshipConfig
  ): YacsConstraint[] {
    const foreignKey = config.foreignKey || "parent_id";
    const constraintName = `fk_${entityName.toLowerCase()}_${foreignKey}`;

    return [
      {
        name: constraintName,
        type: YacsConstraintType.FOREIGN_KEY,
        table: entityName,
        columns: [foreignKey],
        referencedTable: entityName,
        referencedColumns: ["id"],
        onDelete: config.onDelete || YacsCascadeAction.SET_NULL,
        onUpdate: config.onUpdate,
      },
    ];
  }

  public generateSQL(constraint: YacsConstraint): string {
    switch (constraint.type) {
      case YacsConstraintType.FOREIGN_KEY:
        return this.generateForeignKeySQL(constraint);
      case YacsConstraintType.UNIQUE:
        return this.generateUniqueConstraintSQL(constraint);
      case YacsConstraintType.CHECK:
        return this.generateCheckConstraintSQL(constraint);
      default:
        throw new Error(`Unsupported constraint type: ${constraint.type}`);
    }
  }

  private generateForeignKeySQL(constraint: YacsConstraint): string {
    const columns = constraint.columns.join(", ");
    const refColumns = constraint.referencedColumns?.join(", ") || "id";

    let sql = `ALTER TABLE ${constraint.table} 
      ADD CONSTRAINT ${constraint.name} 
      FOREIGN KEY (${columns}) 
      REFERENCES ${constraint.referencedTable}(${refColumns})`;

    if (constraint.onDelete) {
      sql += ` ON DELETE ${constraint.onDelete}`;
    }
    if (constraint.onUpdate) {
      sql += ` ON UPDATE ${constraint.onUpdate}`;
    }

    return sql + ";";
  }

  private generateUniqueConstraintSQL(constraint: YacsConstraint): string {
    const columns = constraint.columns.join(", ");
    return `ALTER TABLE ${constraint.table} 
      ADD CONSTRAINT ${constraint.name} 
      UNIQUE (${columns});`;
  }

  private generateCheckConstraintSQL(constraint: YacsConstraint): string {
    return `ALTER TABLE ${constraint.table} 
      ADD CONSTRAINT ${constraint.name} 
      CHECK (${constraint.condition});`;
  }
}

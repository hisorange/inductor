import { ColumnTools } from '../../../component/column-tools';
import {
  IBlueprint,
  IMigrationContext,
  MigrationRisk,
} from '../../../interface';
import { ICreatePlanner } from '../../../interface/migration/create-planner.interface';
import { createColumn } from './create.column';

export class PostgresCreatePlanner implements ICreatePlanner {
  constructor(protected ctx: IMigrationContext) {}

  async createTable(blueprint: IBlueprint) {
    this.ctx.plan.steps.push({
      query: this.ctx.knex.schema.createTable(blueprint.tableName, () => {}),
      risk: MigrationRisk.NONE,
      description: `Create table [${blueprint.tableName}]`,
      phase: 0,
    });

    // Register the fact that the table exits
    this.ctx.facts.addTable(blueprint.tableName);

    await Promise.all([
      this.createColumn(blueprint),
      this.createIndex(blueprint),
      this.createUnique(blueprint),
      this.createForeignKeys(blueprint),
    ]);
  }

  async createColumn(blueprint: IBlueprint) {
    if (Object.keys(blueprint.columns).length) {
      const createColumnsQuery = this.ctx.knex.schema.alterTable(
        blueprint.tableName,
        builder => {
          for (const name in blueprint.columns) {
            if (Object.prototype.hasOwnProperty.call(blueprint.columns, name)) {
              createColumn(
                builder,
                name,
                blueprint.columns[name],
                blueprint,
                this.ctx.facts,
              );
            }
          }

          const primaries = ColumnTools.filterPrimary(blueprint);

          if (primaries.length > 1) {
            builder.primary(primaries);
          }
        },
      );

      this.ctx.plan.steps.push({
        query: createColumnsQuery,
        risk: MigrationRisk.NONE,
        description: `Create columns for table [${blueprint.tableName}]`,
        phase: 1,
      });
    }
  }

  async createIndex(blueprint: IBlueprint) {
    // Apply the composite indexes
    for (const indexName in blueprint.indexes) {
      if (Object.prototype.hasOwnProperty.call(blueprint.indexes, indexName)) {
        const createIndexQuery = this.ctx.knex.schema.alterTable(
          blueprint.tableName,
          builder =>
            builder.index(
              blueprint.indexes[indexName].columns,
              indexName,
              blueprint.indexes[indexName].type,
            ),
        );

        this.ctx.plan.steps.push({
          query: createIndexQuery,
          risk: MigrationRisk.LOW,
          description: `Create composite index [${indexName}] for table [${blueprint.tableName}]`,
          phase: 2,
        });
      }
    }
  }

  async createUnique(blueprint: IBlueprint) {
    // Apply the composite unique constraints
    for (const uniqueName in blueprint.uniques) {
      if (Object.prototype.hasOwnProperty.call(blueprint.uniques, uniqueName)) {
        if (this.ctx.facts.isUniqueConstraintExists(uniqueName)) {
          throw new Error(
            `Unique constraint [${uniqueName}] for [${blueprint.tableName}] already exists`,
          );
        }

        const createUniqueQuery = this.ctx.knex.schema.alterTable(
          blueprint.tableName,
          builder =>
            builder.unique(blueprint.uniques[uniqueName].columns, {
              indexName: uniqueName,
            }),
        );

        this.ctx.plan.steps.push({
          query: createUniqueQuery,
          risk: MigrationRisk.NONE,
          description: `Create composite unique [${uniqueName}] for table [${blueprint.tableName}]`,
          phase: 2,
        });

        // Track to avoid duplicates in the same migration context.
        this.ctx.facts.addUnique(uniqueName);
      }
    }
  }

  async createForeignKeys(blueprint: IBlueprint) {
    // Add foreign keys
    for (const foreignKeyName in blueprint.relations) {
      if (
        Object.prototype.hasOwnProperty.call(
          blueprint.relations,
          foreignKeyName,
        )
      ) {
        const relation = blueprint.relations[foreignKeyName];
        const { table, columns } = relation.references;
        const { onDelete, onUpdate } = relation;

        const createForeignKeyQuery = this.ctx.knex.schema.alterTable(
          blueprint.tableName,
          builder =>
            builder
              .foreign(relation.columns, foreignKeyName)
              .references(columns)
              .inTable(table)
              .onDelete(onDelete)
              .onUpdate(onUpdate),
        );

        this.ctx.facts.addTableForeignKey(
          blueprint.tableName,
          foreignKeyName,
          relation,
        );

        this.ctx.plan.steps.push({
          query: createForeignKeyQuery,
          risk: this.ctx.facts.isTableExists(table)
            ? MigrationRisk.LOW
            : MigrationRisk.HIGH, // Foreign table may not exists yet!
          description: `Create foreign key [${foreignKeyName}] for table [${blueprint.tableName}]`,
          phase: 8,
        });
      }
    }
  }
}

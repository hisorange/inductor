import { IBlueprint } from '../../../../interface/blueprint/blueprint.interface';
import { IMigrationContext } from '../../../../interface/migration/migration-ctx.interface';
import { MigrationRisk } from '../../../../interface/migration/migration.risk';

export const fkCreator = async (
  blueprint: IBlueprint,
  ctx: IMigrationContext,
) => {
  // Add foreign keys
  for (const foreignKeyName in blueprint.relations) {
    if (
      Object.prototype.hasOwnProperty.call(blueprint.relations, foreignKeyName)
    ) {
      const relation = blueprint.relations[foreignKeyName];
      const { table, columns } = relation.references;
      const { onDelete, onUpdate } = relation;

      const createForeignKeyQuery = ctx.knex.schema.alterTable(
        blueprint.tableName,
        builder =>
          builder
            .foreign(relation.columns, foreignKeyName)
            .references(columns)
            .inTable(table)
            .onDelete(onDelete)
            .onUpdate(onUpdate),
      );

      ctx.plan.steps.push({
        query: createForeignKeyQuery,
        risk: ctx.facts.isTableExists(table)
          ? MigrationRisk.LOW
          : MigrationRisk.HIGH, // Foreign table may not exists yet!
        description: `Create foreign key [${foreignKeyName}] for table [${blueprint.tableName}]`,
        phase: 8,
      });
    }
  }
};

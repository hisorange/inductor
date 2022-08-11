import { IMigrationContext } from '../../../../interface/migration/migration-ctx.interface';
import { MigrationRisk } from '../../../../interface/migration/migration.risk';
import { ISchema } from '../../../../interface/schema/schema.interface';

export const fkCreator = async (schema: ISchema, ctx: IMigrationContext) => {
  // Add foreign keys
  for (const foreignKeyName in schema.relations) {
    if (
      Object.prototype.hasOwnProperty.call(schema.relations, foreignKeyName)
    ) {
      const relation = schema.relations[foreignKeyName];
      const { table, columns } = relation.references;
      const { onDelete, onUpdate } = relation;

      const createForeignKeyQuery = ctx.knex.schema.alterTable(
        schema.tableName,
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
        description: `Create foreign key [${foreignKeyName}] for table [${schema.tableName}]`,
      });
    }
  }
};

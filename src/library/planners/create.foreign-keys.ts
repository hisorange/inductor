import { IMigrationContext } from '../../types/migration-context.interface';
import { MigrationRisk } from '../../types/migration-risk.enum';
import { ITable } from '../../types/table.interface';

export const createForeignKeys = (_table: ITable, ctx: IMigrationContext) => {
  // Add foreign keys
  for (const foreignKeyName in _table.relations) {
    if (
      Object.prototype.hasOwnProperty.call(_table.relations, foreignKeyName)
    ) {
      const relation = _table.relations[foreignKeyName];
      const { table, columns } = relation.references;
      const { onDelete, onUpdate } = relation;

      const createForeignKeyQuery = ctx.knex.schema.alterTable(
        _table.name,
        builder =>
          builder
            .foreign(relation.columns, foreignKeyName)
            .references(columns)
            .inTable(table)
            .onDelete(onDelete)
            .onUpdate(onUpdate),
      );

      ctx.reflection.addTableForeignKey(_table.name, foreignKeyName, relation);

      ctx.plan.steps.push({
        query: createForeignKeyQuery,
        risk: ctx.reflection.isTableExists(table)
          ? MigrationRisk.LOW
          : MigrationRisk.HIGH, // Foreign table may not exists yet!
        description: `Create foreign key [${foreignKeyName}] for table [${_table.name}]`,
        phase: 8,
      });
    }
  }
};

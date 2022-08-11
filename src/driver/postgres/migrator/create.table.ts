import { Knex } from 'knex';
import { ColumnTools } from '../../../column-tools';
import { IFacts } from '../../../interface/facts.interface';
import { IMigrationPlan } from '../../../interface/migration/migration-plan.interface';
import { MigrationRisk } from '../../../interface/migration/migration.risk';
import { ISchema } from '../../../interface/schema/schema.interface';
import { createColumn } from './create.column';

export const createTable = async (
  builder: Knex.SchemaBuilder,
  schema: ISchema,
  facts: IFacts,
  changePlan: IMigrationPlan,
): Promise<void> => {
  const query = builder.createTable(schema.tableName, tableBuilder => {
    for (const name in schema.columns) {
      if (Object.prototype.hasOwnProperty.call(schema.columns, name)) {
        createColumn(tableBuilder, name, schema.columns[name], schema);
      }
    }

    const primaries = ColumnTools.filterPrimary(schema);

    if (primaries.length > 1) {
      tableBuilder.primary(primaries);
    }

    // Apply the compositive indexes
    for (const indexName in schema.indexes) {
      if (Object.prototype.hasOwnProperty.call(schema.indexes, indexName)) {
        // if (facts.uniqueConstraints.includes(indexName)) {
        //   throw new Error(
        //     `Index [${indexName}] for [${schema.tableName}] already exists`,
        //   );
        // }

        tableBuilder.index(
          schema.indexes[indexName].columns,
          indexName,
          schema.indexes[indexName].type,
        );
      }
    }

    // Apply the compositive unique constraints
    for (const uniqueName in schema.uniques) {
      if (Object.prototype.hasOwnProperty.call(schema.uniques, uniqueName)) {
        if (facts.isUniqueConstraintExists(uniqueName)) {
          throw new Error(
            `Unique constraint [${uniqueName}] for [${schema.tableName}] already exists`,
          );
        }

        tableBuilder.unique(schema.uniques[uniqueName].columns, {
          indexName: uniqueName,
        });
      }
    }

    // Add foreign keys
    for (const foreignKeyName in schema.relations) {
      if (
        Object.prototype.hasOwnProperty.call(schema.relations, foreignKeyName)
      ) {
        const relation = schema.relations[foreignKeyName];
        const { table, columns } = relation.references;
        const { onDelete, onUpdate } = relation;

        tableBuilder
          .foreign(relation.columns, foreignKeyName)
          .references(columns)
          .inTable(table)
          .onDelete(onDelete)
          .onUpdate(onUpdate);
      }
    }
  });

  changePlan.steps.push({
    query,
    risk: MigrationRisk.NONE,
    description: 'Table does not exists, creating it',
  });
};

import { Knex } from 'knex';
import { ColumnTools } from '../../../column-tools';
import { IFacts } from '../../../interface/facts.interface';
import { ISchema } from '../../../interface/schema/schema.interface';
import { createColumn } from './create.column';

export const createTable = (
  builder: Knex.SchemaBuilder,
  schema: ISchema,
  facts: IFacts,
): Knex.SchemaBuilder =>
  builder.createTable(schema.tableName, table => {
    for (const name in schema.columns) {
      if (Object.prototype.hasOwnProperty.call(schema.columns, name)) {
        createColumn(table, name, schema.columns[name], schema);
      }
    }

    const primaries = ColumnTools.filterPrimary(schema);

    if (primaries.length > 1) {
      table.primary(primaries);
    }

    // Apply the compositive unique constraints
    for (const uniqueName in schema.uniques) {
      if (Object.prototype.hasOwnProperty.call(schema.uniques, uniqueName)) {
        if (facts.uniqueConstraints.includes(uniqueName)) {
          throw new Error(
            `Unique constraint [${uniqueName}] for [${schema.tableName}] already exists`,
          );
        }

        table.unique(schema.uniques[uniqueName].columns, {
          indexName: uniqueName,
        });
      }
    }
  });

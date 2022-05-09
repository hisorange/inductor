import { Knex } from 'knex';
import { ISchema } from '../interface/schema.interface';
import { filterPrimary } from '../util/primary.filter';
import { createColumn } from './create.column';

export const createTable = (
  builder: Knex.SchemaBuilder,
  schema: ISchema,
): Knex.SchemaBuilder =>
  builder.createTable(schema.name, table => {
    for (const name in schema.columns) {
      if (Object.prototype.hasOwnProperty.call(schema.columns, name)) {
        createColumn(table, name, schema.columns[name], schema);
      }
    }

    const primaries = filterPrimary(schema);

    if (primaries.length > 1) {
      table.primary(primaries);
    }

    // Apply the compositive unique constraints
    for (const name in schema.uniques) {
      if (Object.prototype.hasOwnProperty.call(schema.uniques, name)) {
        // Prefix the unique name with the table name if it is not already prefixed
        const uniqueName = name.startsWith(schema.name)
          ? name
          : `${schema.name}_${name}`;

        table.unique(schema.uniques[name], {
          indexName: uniqueName,
        });
      }
    }
  });

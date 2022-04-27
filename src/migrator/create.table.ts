import { Knex } from 'knex';
import { ISchema } from '../interface/schema.interface';
import { createColumn } from './create.column';

export const createTable = (
  builder: Knex.SchemaBuilder,
  schema: ISchema,
): Knex.SchemaBuilder =>
  builder.createTable(schema.name, table => {
    for (const name in schema.columns) {
      if (Object.prototype.hasOwnProperty.call(schema.columns, name)) {
        createColumn(table, name, schema.columns[name]);
      }
    }
  });

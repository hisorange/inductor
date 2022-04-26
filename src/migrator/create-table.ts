import { Knex } from 'knex';
import { ColumnType } from '../enum/column-type.enum';
import { ISchema } from '../interface/schema.interface';

export const createTable = (builder: Knex.SchemaBuilder, schema: ISchema) =>
  builder.createTable(schema.name, table => {
    for (const name in schema.columns) {
      if (Object.prototype.hasOwnProperty.call(schema.columns, name)) {
        const column = schema.columns[name];

        switch (column.type) {
          case ColumnType.TEXT:
            table.text(name);
            break;

          default:
            throw new Error(`Unsupported column type: ${column.type}`);
        }
      }
    }
  });

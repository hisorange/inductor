import { diff } from 'just-diff';
import { Knex } from 'knex';
import { ISchema } from '../interface/schema.interface';
import { createColumn } from './create.column';

export const alterTable = (
  builder: Knex.SchemaBuilder,
  currentSchema: ISchema,
  expectedSchema: ISchema,
): Knex.SchemaBuilder => {
  return builder.alterTable(expectedSchema.name, async table => {
    const differences = diff(currentSchema, expectedSchema);

    for (const change of differences) {
      const { op, path } = change;

      if (path[0] === 'columns' && path.length === 2) {
        const columnName = path[1] as string;

        switch (op) {
          // New column added
          case 'add':
            createColumn(table, columnName, expectedSchema.columns[columnName]);
            break;

          // Column removed
          case 'remove':
            table.dropColumn(columnName);
            break;

          // Column changed
          case 'replace':
            throw new Error('Column change is not implemented');
        }
      } else {
        console.error(
          'Current',
          currentSchema,
          'Expected',
          expectedSchema,
          'Change',
          change,
        );
        throw new Error('Logged change is not supported');
      }
    }
  });
};

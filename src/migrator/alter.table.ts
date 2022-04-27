import { diff } from 'just-diff';
import { Knex } from 'knex';
import { ISchema } from '../interface/schema.interface';
import { createColumn } from './create.column';

export const alterTable = (
  builder: Knex.SchemaBuilder,
  currentSchema: ISchema,
  expectedSchema: ISchema,
): Knex.SchemaBuilder => {
  return builder.alterTable(expectedSchema.name, async alter => {
    const differences = diff(currentSchema, expectedSchema);

    // console.log('Differences:', differences);
    // console.log('Current schema:', currentSchema);
    // console.log('Expected schema:', expectedSchema);

    for (const change of differences) {
      const { op, path } = change;

      if (path[0] === 'columns') {
        const columnName = path[1] as string;

        switch (op) {
          // New column added
          case 'add':
            createColumn(alter, columnName, expectedSchema.columns[columnName]);
            break;

          // Column removed
          case 'remove':
            alter.dropColumn(columnName);
            break;

          // Column changed
          case 'replace':
            // Change the nullable state
            if (path[1] === columnName && path[2] === 'isNullable') {
              if (expectedSchema.columns[columnName].isNullable) {
                alter.setNullable(columnName);
              } else {
                alter.dropNullable(columnName);
              }
            } else {
              console.error(
                'Column change is not implemented:' +
                  JSON.stringify(differences, null, 2),
              );
            }
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

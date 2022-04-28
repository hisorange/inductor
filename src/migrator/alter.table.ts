import { diff } from 'just-diff';
import { Knex } from 'knex';
import { ISchema } from '../interface/schema.interface';
import { alterNullable, alterUnique } from './alter.column';
import { createColumn } from './create.column';

export const alterTable = (
  builder: Knex.SchemaBuilder,
  currentSchema: ISchema,
  expectedSchema: ISchema,
): Knex.SchemaBuilder => {
  return builder.alterTable(expectedSchema.name, async builder => {
    const difference = diff(currentSchema, expectedSchema);

    for (const change of difference) {
      const { op, path } = change;

      if (path[0] === 'columns') {
        const name = path[1] as string;

        switch (op) {
          // New column added
          case 'add':
            createColumn(builder, name, expectedSchema.columns[name]);
            break;

          // Column removed
          case 'remove':
            builder.dropColumn(name);
            break;

          // Column altered
          case 'replace':
            if (path[1] === name) {
              const def = expectedSchema.columns[name];

              // Route the alteration based on the change
              switch (path[2]) {
                case 'isNullable':
                  alterNullable(builder, name, def.isNullable);
                  break;
                case 'isUnique':
                  alterUnique(builder, name, def.isUnique);
                  break;
              }
            } else {
              console.error(
                'Column change is not implemented:' +
                  JSON.stringify(change, null, 2),
              );
            }
        }
      }
    }
  });
};

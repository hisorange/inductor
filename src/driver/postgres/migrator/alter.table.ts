import { diff } from 'just-diff';
import { Knex } from 'knex';
import { ColumnTools } from '../../../column-tools';
import { ISchema } from '../../../interface/schema/schema.interface';
import { alterNullable, alterUnique } from './alter.column';
import { createColumn } from './create.column';

export const alterTable = (
  builder: Knex.SchemaBuilder,
  currentSchema: ISchema,
  expectedSchema: ISchema,
): Knex.SchemaBuilder => {
  return builder.alterTable(expectedSchema.tableName, async builder => {
    const difference = diff(currentSchema, expectedSchema);
    // Track the primary keys change, since it may has to be altered after the columns
    let isPrimaryChanged = false;
    let isPrimaryCreated = false;
    let isPrimaryDropped = false;

    for (const change of difference) {
      const { op, path } = change;

      if (path[0] === 'columns') {
        const name = path[1] as string;

        switch (op) {
          // New column added
          case 'add':
            createColumn(
              builder,
              name,
              expectedSchema.columns[name],
              expectedSchema,
            );

            // New column added to the primary list
            if (expectedSchema.columns[name].isPrimary) {
              isPrimaryChanged = true;
              isPrimaryCreated = true;
            }

            break;

          // Column removed
          case 'remove':
            builder.dropColumn(name);

            // Column removed from the primary list
            if (currentSchema.columns[name].isPrimary) {
              isPrimaryChanged = true;
              isPrimaryDropped = true;
            }

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
                case 'isPrimary':
                  isPrimaryChanged = true;
                  break;
                case 'isIndexed':
                  // TODO: implement index type change
                  break;
                case 'defaultValue':
                  const alterer = builder.specificType(name, def.type);

                  // Add default value
                  if (def.defaultValue !== undefined) {
                    alterer.defaultTo(def.defaultValue);
                  }

                  alterer.alter({
                    alterNullable: false,
                    alterType: false,
                  });
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
      // Change is affecting the unique set
      else if (path[0] === 'uniques') {
        const uniqueName = path[1] as string;

        switch (op) {
          // New unique added
          case 'add':
            // We have to check if the unique existed before
            // because the add is only applied to the columns
            if (currentSchema.uniques[uniqueName]) {
              builder.dropUnique(
                currentSchema.uniques[uniqueName].columns,
                uniqueName,
              );
            }

            builder.unique(expectedSchema.uniques[uniqueName].columns, {
              indexName: uniqueName,
            });
            break;

          // Unique removed
          case 'remove':
            builder.dropUnique(
              currentSchema.uniques[uniqueName].columns,
              uniqueName,
            );
            break;
        }
      }
    }

    // Primary key changed
    if (isPrimaryChanged) {
      const currentPrimaries = ColumnTools.filterPrimary(currentSchema);
      const expectedPrimaries = ColumnTools.filterPrimary(expectedSchema);

      // Remove the current primary keys
      if (currentPrimaries.length > 0) {
        // By default, it's easier to drop the primary keys
        // But some exceptions are handled here
        let shouldDropPrimary = true;

        // Except when the primary was a single key and the column was dropped
        // In this case the primary is cascades with the dropped column
        if (currentPrimaries.length === 1 && expectedPrimaries.length === 0) {
          if (isPrimaryDropped) {
            shouldDropPrimary = false;
          }
        }

        if (shouldDropPrimary) {
          builder.dropPrimary();
        }
      }

      // Add the new primary keys
      if (expectedPrimaries.length > 0) {
        let shouldAddCompositePrimary = true;

        // Except when we add the first primary, and the column is created with the create column call
        if (currentPrimaries.length === 0 && expectedPrimaries.length === 1) {
          if (isPrimaryCreated) {
            shouldAddCompositePrimary = false;
          }
        }

        if (shouldAddCompositePrimary) {
          builder.primary(expectedPrimaries);
        }
      }
    }
  });
};

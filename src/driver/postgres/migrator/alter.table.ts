import { diff } from 'just-diff';
import { Knex } from 'knex';
import { ColumnTools } from '../../../column-tools';
import { IMigrationPlan } from '../../../interface/migration/migration-plan.interface';
import { MigrationRisk } from '../../../interface/migration/migration.risk';
import { PostgresColumnType } from '../../../interface/schema/postgres/postgres.column-type';
import { ISchema } from '../../../interface/schema/schema.interface';
import { createColumn } from './create.column';
import { getTypeName } from './util/get-type-name';

export const alterTable = async (
  schemaBuilder: Knex.SchemaBuilder,
  currentSchema: ISchema,
  expectedSchema: ISchema,
  changePlan: IMigrationPlan,
): Promise<void> => {
  const query = schemaBuilder.alterTable(
    expectedSchema.tableName,
    async tableBuilder => {
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
                tableBuilder,
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
              tableBuilder.dropColumn(name);

              // Column removed from the primary list
              if (currentSchema.columns[name].isPrimary) {
                isPrimaryChanged = true;
                isPrimaryDropped = true;
              }

              break;

            // Column altered
            case 'replace':
              if (path[1] === name) {
                const column = expectedSchema.columns[name];

                // Route the alteration based on the change
                switch (path[2]) {
                  case 'isNullable':
                    if (column.isNullable) {
                      tableBuilder.setNullable(name);
                    } else {
                      tableBuilder.dropNullable(name);
                    }
                    break;
                  case 'isUnique':
                    if (column.isUnique) {
                      tableBuilder.unique([name]);
                    } else {
                      tableBuilder.dropUnique([name]);
                    }
                    break;
                  case 'isPrimary':
                    isPrimaryChanged = true;
                    break;
                  case 'isIndexed':
                    // TODO: implement index type change
                    break;
                  case 'defaultValue':
                    let columnBuilder: Knex.ColumnBuilder;

                    if (column.type.name === PostgresColumnType.ENUM) {
                      columnBuilder = tableBuilder.enum(
                        name,
                        column.type.values,
                        {
                          useNative: true,
                          enumName: column.type.nativeName,
                        },
                      );
                    } else if (column.type.name === PostgresColumnType.JSON) {
                      columnBuilder = tableBuilder.json(name);
                    } else if (column.type.name === PostgresColumnType.JSONB) {
                      columnBuilder = tableBuilder.jsonb(name);
                    } else {
                      columnBuilder = tableBuilder.specificType(
                        name,
                        getTypeName(column),
                      );
                    }

                    // Defauls is null
                    const isDefaultNull = column.defaultValue === null;

                    // Add default value
                    if (column.defaultValue !== undefined) {
                      columnBuilder.defaultTo(column.defaultValue);
                    }

                    // Add null default value
                    if (isDefaultNull) {
                      columnBuilder.nullable();
                    }

                    columnBuilder.alter({
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
                tableBuilder.dropUnique(
                  currentSchema.uniques[uniqueName].columns,
                  uniqueName,
                );
              }

              tableBuilder.unique(expectedSchema.uniques[uniqueName].columns, {
                indexName: uniqueName,
              });
              break;

            // Unique removed
            case 'remove':
              tableBuilder.dropUnique(
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
            tableBuilder.dropPrimary();
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
            tableBuilder.primary(expectedPrimaries);
          }
        }
      }
    },
  );

  changePlan.steps.push({
    query,
    risk: MigrationRisk.MEDIUM,
    description: 'Table state differs from the expected state',
    phase: 3,
  });
};

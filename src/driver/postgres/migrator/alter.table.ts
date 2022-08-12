import { diff } from 'just-diff';
import { Knex } from 'knex';
import { ColumnTools } from '../../../column-tools';
import { IColumn } from '../../../interface/blueprint';
import { IBlueprint } from '../../../interface/blueprint/blueprint.interface';
import { PostgresColumnType } from '../../../interface/blueprint/postgres/postgres.column-type';
import { IMigrationContext } from '../../../interface/migration/migration-ctx.interface';
import { MigrationRisk } from '../../../interface/migration/migration.risk';
import { createColumn } from './create.column';
import { getTypeName } from './util/get-type-name';

const changeDefaultValue = (
  builder: Knex.AlterTableBuilder,
  columnName: string,
  columnDefinition: IColumn,
) => {
  let columnBuilder: Knex.ColumnBuilder;

  if (columnDefinition.type.name === PostgresColumnType.ENUM) {
    columnBuilder = builder.enum(columnName, columnDefinition.type.values, {
      useNative: true,
      enumName: columnDefinition.type.nativeName,
    });
  } else if (columnDefinition.type.name === PostgresColumnType.JSON) {
    columnBuilder = builder.json(columnName);
  } else if (columnDefinition.type.name === PostgresColumnType.JSONB) {
    columnBuilder = builder.jsonb(columnName);
  } else {
    columnBuilder = builder.specificType(
      columnName,
      getTypeName(columnDefinition),
    );
  }

  // Defauls is null
  const isDefaultNull = columnDefinition.defaultValue === null;

  // Add default value
  if (columnDefinition.defaultValue !== undefined) {
    columnBuilder.defaultTo(columnDefinition.defaultValue);
  }

  // Add null default value
  if (isDefaultNull) {
    columnBuilder.nullable();
  }

  columnBuilder.alter({
    alterNullable: false,
    alterType: false,
  });
};

const changeNullable = (
  builder: Knex.AlterTableBuilder,
  columnName: string,
  columnDefinition: IColumn,
) => {
  if (columnDefinition.isNullable) {
    builder.setNullable(columnName);
  } else {
    builder.dropNullable(columnName);
  }
};

const changeUnique = (
  builder: Knex.AlterTableBuilder,
  columnName: string,
  columnDefinition: IColumn,
) => {
  if (columnDefinition.isUnique) {
    builder.unique([columnName]);
  } else {
    builder.dropUnique([columnName]);
  }
};

export const alterTable = async (
  ctx: IMigrationContext,
  current: IBlueprint,
  target: IBlueprint,
): Promise<void> => {
  const difference = diff(current, target);
  // Track the primary keys change, since it may has to be altered after the columns
  let isPrimaryChanged = false;
  let isPrimaryCreated = false;
  let isPrimaryDropped = false;

  for (const change of difference) {
    const { op, path } = change;

    if (path[0] === 'columns') {
      const columnName = path[1] as string;
      const columnDefinition = target.columns[columnName];

      switch (op) {
        // New column added
        case 'add':
          let risk = MigrationRisk.NONE;

          // Check if the column has a default value
          // If not then we have to check for rows
          // as creating a new column without default would make the step impossible
          if (typeof columnDefinition.defaultValue === 'undefined') {
            if (await ctx.facts.isTableHasRows(target.tableName)) {
              risk = MigrationRisk.IMPOSSIBLE;
            }
          }

          ctx.plan.steps.push({
            query: ctx.knex.schema.alterTable(target.tableName, builder =>
              createColumn(
                builder,
                columnName,
                target.columns[columnName],
                target,
                ctx.facts,
              ),
            ),
            risk,
            description: `Creating new column ${columnName}`,
            phase: 3,
          });

          // New column added to the primary list
          if (target.columns[columnName].isPrimary) {
            isPrimaryChanged = true;
            isPrimaryCreated = true;
          }

          break;

        // Column removed
        case 'remove':
          ctx.plan.steps.push({
            query: ctx.knex.schema.alterTable(target.tableName, builder =>
              builder.dropColumn(columnName),
            ),
            risk: MigrationRisk.LOW,
            description: `Dropping column ${columnName}`,
            phase: 3,
          });

          // Column removed from the primary list
          if (current.columns[columnName].isPrimary) {
            isPrimaryChanged = true;
            isPrimaryDropped = true;
          }
          break;

        // Column altered
        case 'replace':
          if (path[1] === columnName) {
            // Route the alteration based on the change
            switch (path[2]) {
              case 'isNullable':
                ctx.plan.steps.push({
                  query: ctx.knex.schema.alterTable(target.tableName, builder =>
                    changeNullable(builder, columnName, columnDefinition),
                  ),
                  risk: MigrationRisk.LOW,
                  description: `Changing column ${columnName} nullable state`,
                  phase: 3,
                });
                break;
              case 'isUnique':
                ctx.plan.steps.push({
                  query: ctx.knex.schema.alterTable(target.tableName, builder =>
                    changeUnique(builder, columnName, columnDefinition),
                  ),
                  risk: MigrationRisk.LOW,
                  description: `Changing column ${columnName} unique state`,
                  phase: 3,
                });
                break;
              case 'isPrimary':
                isPrimaryChanged = true;
                break;
              case 'isIndexed':
                // TODO implement index type change
                break;
              case 'defaultValue':
                ctx.plan.steps.push({
                  query: ctx.knex.schema.alterTable(target.tableName, builder =>
                    changeDefaultValue(builder, columnName, columnDefinition),
                  ),
                  risk: MigrationRisk.LOW,
                  description: `Changing column ${columnName} default value`,
                  phase: 3,
                });
                break;
              case 'type':
                // TODO implement type change

                if (columnDefinition.type.name === PostgresColumnType.ENUM) {
                  // Changing enum values
                  if (path[3] === 'values') {
                    // Check if the native type already exists
                    if (
                      ctx.facts.isTypeExists(columnDefinition.type.nativeName)
                    ) {
                      // Need to check if the values are the same
                      // Rename the type if not connected to other tables
                      // Fail if so
                      // Then create the new type and use the old name
                      // And after it's created we can drop the old one
                    }
                  }
                }
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
          if (current.uniques[uniqueName]) {
            ctx.plan.steps.push({
              query: ctx.knex.schema.alterTable(target.tableName, builder =>
                builder.dropUnique(
                  current.uniques[uniqueName].columns,
                  uniqueName,
                ),
              ),
              risk: MigrationRisk.LOW,
              description: `Dropping unique ${uniqueName} before recreation`,
              phase: 3,
            });
          }

          ctx.plan.steps.push({
            query: ctx.knex.schema.alterTable(target.tableName, builder =>
              builder.unique(target.uniques[uniqueName].columns, {
                indexName: uniqueName,
              }),
            ),
            risk: MigrationRisk.LOW,
            description: `Creating compositive unique ${uniqueName}`,
            phase: 3,
          });

          break;

        // Unique removed
        case 'remove':
          ctx.plan.steps.push({
            query: ctx.knex.schema.alterTable(target.tableName, builder =>
              builder.dropUnique(
                current.uniques[uniqueName].columns,
                uniqueName,
              ),
            ),
            risk: MigrationRisk.LOW,
            description: `Dropping compositive unique ${uniqueName}`,
            phase: 3,
          });
          break;
      }
    }
  }

  // Primary key changed
  if (isPrimaryChanged) {
    const currentPrimaries = ColumnTools.filterPrimary(current);
    const expectedPrimaries = ColumnTools.filterPrimary(target);

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
        ctx.plan.steps.push({
          query: ctx.knex.schema.alterTable(target.tableName, builder =>
            builder.dropPrimary(),
          ),
          risk: MigrationRisk.LOW,
          description: `Dropping primary for ${target.tableName}`,
          phase: 3,
        });
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
        ctx.plan.steps.push({
          query: ctx.knex.schema.alterTable(target.tableName, builder =>
            builder.primary(expectedPrimaries),
          ),
          risk: MigrationRisk.LOW,
          description: `Creating primary for ${target.tableName}`,
          phase: 3,
        });
      }
    }
  }
};

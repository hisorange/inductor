import { diff } from 'just-diff';
import { Knex } from 'knex';
import { ColumnType, IBlueprint, IColumn } from '../blueprint';
import { ColumnTools } from '../tools/column-tools';
import { stripMeta } from '../tools/strip-meta';
import { IMigrationContext } from './types/migration-context.interface';
import { IMigrationPlanner } from './types/migration-planner.interface';
import { MigrationRisk } from './types/migration-risk.enum';
import { createColumn } from './util/column.creator';
import { getPostgresTypeName } from './util/get-type-name';

export class MigrationPlanner implements IMigrationPlanner {
  constructor(readonly ctx: IMigrationContext) {}

  async alterTable(targetState: IBlueprint) {
    const currentState = this.ctx.factManager.getBlueprintForTable(
      targetState.tableName,
    );
    const difference = diff(stripMeta(currentState), stripMeta(targetState));
    // Track the primary keys change, since it may has to be altered after the columns
    let isPrimaryChanged = false;
    let isPrimaryCreated = false;
    let isPrimaryDropped = false;

    for (const change of difference) {
      const { op, path } = change;

      // Changed to logged / unlogged
      if (path[0] === 'isLogged') {
        if (op === 'replace') {
          this.ctx.migrationPlan.steps.push({
            query: this.ctx.knex.schema.raw(
              `ALTER TABLE "${targetState.tableName}" SET ${
                targetState.isLogged ? 'LOGGED' : 'UNLOGGED'
              }`,
            ),
            risk: MigrationRisk.LOW,
            description: `Changing table ${targetState.tableName} to ${
              targetState.isLogged ? 'logged' : 'unlogged'
            }`,
            phase: 1,
          });
        }
      } else if (path[0] === 'columns') {
        const columnName = path[1] as string;
        const columnDefinition = targetState.columns[columnName];

        switch (op) {
          // New column added
          case 'add':
            let risk = MigrationRisk.NONE;

            // Check if the column has a default value
            // If not then we have to check for rows
            // as creating a new column without default would make the step impossible
            if (typeof columnDefinition.defaultValue === 'undefined') {
              if (
                await this.ctx.factManager.isTableHasRows(targetState.tableName)
              ) {
                risk = MigrationRisk.IMPOSSIBLE;
              }
            }

            this.ctx.migrationPlan.steps.push({
              query: this.ctx.knex.schema.alterTable(
                targetState.tableName,
                builder =>
                  createColumn(
                    builder,
                    columnName,
                    targetState.columns[columnName],
                    targetState,
                    this.ctx.factManager,
                  ),
              ),
              risk,
              description: `Creating new column ${columnName}`,
              phase: 3,
            });

            // New column added to the primary list
            if (targetState.columns[columnName].isPrimary) {
              isPrimaryChanged = true;
              isPrimaryCreated = true;
            }

            break;

          // Column removed
          case 'remove':
            this.ctx.migrationPlan.steps.push({
              query: this.ctx.knex.schema.alterTable(
                targetState.tableName,
                builder => builder.dropColumn(columnName),
              ),
              risk: MigrationRisk.LOW,
              description: `Dropping column ${columnName}`,
              phase: 3,
            });

            // Column removed from the primary list
            if (currentState.columns[columnName].isPrimary) {
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
                  this.ctx.migrationPlan.steps.push({
                    query: this.ctx.knex.schema.alterTable(
                      targetState.tableName,
                      builder =>
                        this.changeNullable(
                          builder,
                          columnName,
                          columnDefinition,
                        ),
                    ),
                    risk: MigrationRisk.LOW,
                    description: `Changing column ${columnName} nullable state`,
                    phase: 3,
                  });
                  break;
                case 'isUnique':
                  this.ctx.migrationPlan.steps.push({
                    query: this.ctx.knex.schema.alterTable(
                      targetState.tableName,
                      builder =>
                        this.changeUnique(
                          builder,
                          columnName,
                          columnDefinition,
                        ),
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
                  this.ctx.migrationPlan.steps.push({
                    query: this.ctx.knex.schema.alterTable(
                      targetState.tableName,
                      builder =>
                        this.changeDefaultValue(
                          builder,
                          columnName,
                          columnDefinition,
                        ),
                    ),
                    risk: MigrationRisk.LOW,
                    description: `Changing column ${columnName} default value`,
                    phase: 3,
                  });
                  break;
                case 'type':
                  // TODO implement type change

                  if (columnDefinition.type.name === ColumnType.ENUM) {
                    // Changing enum values
                    if (path[3] === 'values') {
                      // Check if the native type already exists
                      if (
                        this.ctx.factManager.isTypeExists(
                          columnDefinition.type.nativeName,
                        )
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
            if (currentState.uniques[uniqueName]) {
              this.ctx.migrationPlan.steps.push({
                query: this.ctx.knex.schema.alterTable(
                  targetState.tableName,
                  builder =>
                    builder.dropUnique(
                      currentState.uniques[uniqueName].columns,
                      uniqueName,
                    ),
                ),
                risk: MigrationRisk.LOW,
                description: `Dropping unique ${uniqueName} before recreation`,
                phase: 3,
              });
            }

            this.ctx.migrationPlan.steps.push({
              query: this.ctx.knex.schema.alterTable(
                targetState.tableName,
                builder =>
                  builder.unique(targetState.uniques[uniqueName].columns, {
                    indexName: uniqueName,
                  }),
              ),
              risk: MigrationRisk.LOW,
              description: `Creating composite unique ${uniqueName}`,
              phase: 3,
            });

            break;

          // Unique removed
          case 'remove':
            this.ctx.migrationPlan.steps.push({
              query: this.ctx.knex.schema.alterTable(
                targetState.tableName,
                builder =>
                  builder.dropUnique(
                    currentState.uniques[uniqueName].columns,
                    uniqueName,
                  ),
              ),
              risk: MigrationRisk.LOW,
              description: `Dropping composite unique ${uniqueName}`,
              phase: 3,
            });
            break;
        }
      }
    }

    // Primary key changed
    if (isPrimaryChanged) {
      const currentPrimaries = ColumnTools.filterPrimary(currentState);
      const expectedPrimaries = ColumnTools.filterPrimary(targetState);

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
          this.ctx.migrationPlan.steps.push({
            query: this.ctx.knex.schema.alterTable(
              targetState.tableName,
              builder => builder.dropPrimary(),
            ),
            risk: MigrationRisk.LOW,
            description: `Dropping primary for ${targetState.tableName}`,
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
          this.ctx.migrationPlan.steps.push({
            query: this.ctx.knex.schema.alterTable(
              targetState.tableName,
              builder => builder.primary(expectedPrimaries),
            ),
            risk: MigrationRisk.LOW,
            description: `Creating primary for ${targetState.tableName}`,
            phase: 3,
          });
        }
      }
    }
  }

  protected changeUnique(
    builder: Knex.AlterTableBuilder,
    columnName: string,
    columnDefinition: IColumn,
  ) {
    if (columnDefinition.isUnique) {
      builder.unique([columnName]);
    } else {
      builder.dropUnique([columnName]);
    }
  }

  protected changeNullable(
    builder: Knex.AlterTableBuilder,
    columnName: string,
    columnDefinition: IColumn,
  ) {
    if (columnDefinition.isNullable) {
      builder.setNullable(columnName);
    } else {
      builder.dropNullable(columnName);
    }
  }

  protected changeDefaultValue(
    builder: Knex.AlterTableBuilder,
    columnName: string,
    columnDefinition: IColumn,
  ) {
    let columnBuilder: Knex.ColumnBuilder;

    if (columnDefinition.type.name === ColumnType.ENUM) {
      columnBuilder = builder.enum(columnName, columnDefinition.type.values, {
        useNative: true,
        enumName: columnDefinition.type.nativeName,
      });
    } else if (columnDefinition.type.name === ColumnType.JSON) {
      columnBuilder = builder.json(columnName);
    } else if (columnDefinition.type.name === ColumnType.JSONB) {
      columnBuilder = builder.jsonb(columnName);
    } else {
      columnBuilder = builder.specificType(
        columnName,
        getPostgresTypeName(columnDefinition),
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
  }

  async _createTable(blueprint: IBlueprint): Promise<void> {
    this.ctx.migrationPlan.steps.push({
      query: this.ctx.knex.schema.createTable(blueprint.tableName, () => {}),
      risk: MigrationRisk.NONE,
      description: `Create table [${blueprint.tableName}]`,
      phase: 0,
    });

    // Register the fact that the table exits
    this.ctx.factManager.addTable(blueprint.tableName);

    // By default each table is created as logged
    // But we can alter the table to be unlogged
    if (!blueprint.isLogged) {
      this.ctx.migrationPlan.steps.push({
        query: this.ctx.knex.schema.raw(
          `ALTER TABLE ${this.ctx.knex.client.wrapIdentifier(
            blueprint.tableName,
          )} SET UNLOGGED`,
        ),
        risk: MigrationRisk.NONE,
        description: `Set table [${blueprint.tableName}] as unlogged`,
        phase: 0,
      });
    }
  }

  async createTable(blueprint: IBlueprint) {
    this._createTable(blueprint);

    await Promise.all([
      this.createColumn(blueprint),
      this.createIndex(blueprint),
      this.createUnique(blueprint),
      this.createForeignKeys(blueprint),
    ]);
  }

  async createColumn(blueprint: IBlueprint) {
    if (Object.keys(blueprint.columns).length) {
      const createColumnsQuery = this.ctx.knex.schema.alterTable(
        blueprint.tableName,
        builder => {
          for (const name in blueprint.columns) {
            if (Object.prototype.hasOwnProperty.call(blueprint.columns, name)) {
              createColumn(
                builder,
                name,
                blueprint.columns[name],
                blueprint,
                this.ctx.factManager,
              );
            }
          }

          const primaries = ColumnTools.filterPrimary(blueprint);

          if (primaries.length > 1) {
            builder.primary(primaries);
          }
        },
      );

      this.ctx.migrationPlan.steps.push({
        query: createColumnsQuery,
        risk: MigrationRisk.NONE,
        description: `Create columns for table [${blueprint.tableName}]`,
        phase: 1,
      });
    }
  }

  async createIndex(blueprint: IBlueprint) {
    // Apply the composite indexes
    for (const indexName in blueprint.indexes) {
      if (Object.prototype.hasOwnProperty.call(blueprint.indexes, indexName)) {
        const createIndexQuery = this.ctx.knex.schema.alterTable(
          blueprint.tableName,
          builder =>
            builder.index(
              blueprint.indexes[indexName].columns,
              indexName,
              blueprint.indexes[indexName].type,
            ),
        );

        this.ctx.migrationPlan.steps.push({
          query: createIndexQuery,
          risk: MigrationRisk.LOW,
          description: `Create composite index [${indexName}] for table [${blueprint.tableName}]`,
          phase: 2,
        });
      }
    }
  }

  async createUnique(blueprint: IBlueprint) {
    // Apply the composite unique constraints
    for (const uniqueName in blueprint.uniques) {
      if (Object.prototype.hasOwnProperty.call(blueprint.uniques, uniqueName)) {
        if (this.ctx.factManager.isUniqueConstraintExists(uniqueName)) {
          throw new Error(
            `Unique constraint [${uniqueName}] for [${blueprint.tableName}] already exists`,
          );
        }

        const createUniqueQuery = this.ctx.knex.schema.alterTable(
          blueprint.tableName,
          builder =>
            builder.unique(blueprint.uniques[uniqueName].columns, {
              indexName: uniqueName,
            }),
        );

        this.ctx.migrationPlan.steps.push({
          query: createUniqueQuery,
          risk: MigrationRisk.NONE,
          description: `Create composite unique [${uniqueName}] for table [${blueprint.tableName}]`,
          phase: 2,
        });

        // Track to avoid duplicates in the same migration context.
        this.ctx.factManager.addUnique(uniqueName);
      }
    }
  }

  async createForeignKeys(blueprint: IBlueprint) {
    // Add foreign keys
    for (const foreignKeyName in blueprint.relations) {
      if (
        Object.prototype.hasOwnProperty.call(
          blueprint.relations,
          foreignKeyName,
        )
      ) {
        const relation = blueprint.relations[foreignKeyName];
        const { table, columns } = relation.references;
        const { onDelete, onUpdate } = relation;

        const createForeignKeyQuery = this.ctx.knex.schema.alterTable(
          blueprint.tableName,
          builder =>
            builder
              .foreign(relation.columns, foreignKeyName)
              .references(columns)
              .inTable(table)
              .onDelete(onDelete)
              .onUpdate(onUpdate),
        );

        this.ctx.factManager.addTableForeignKey(
          blueprint.tableName,
          foreignKeyName,
          relation,
        );

        this.ctx.migrationPlan.steps.push({
          query: createForeignKeyQuery,
          risk: this.ctx.factManager.isTableExists(table)
            ? MigrationRisk.LOW
            : MigrationRisk.HIGH, // Foreign table may not exists yet!
          description: `Create foreign key [${foreignKeyName}] for table [${blueprint.tableName}]`,
          phase: 8,
        });
      }
    }
  }
}

import { diff } from 'just-diff';
import { NotImplemented } from '../exception/not-implemented.exception';
import { ChangeContext } from '../types/change-context.interface';
import { IMigrationContext } from '../types/migration-context.interface';
import { MigrationRisk } from '../types/migration-risk.enum';
import { ITable } from '../types/table.interface';
import { ColumnTools } from '../utils/column-tools';
import { stripMeta } from '../utils/strip-meta';
import { addColumn } from './planners/add.column';
import { alterDefaultValue } from './planners/alter.default-value';
import { alterIsLogged } from './planners/alter.is-logged';
import { alterNullable } from './planners/alter.nullable';
import { alterUnique } from './planners/alter.unique';
import { createColumn } from './planners/column.creator';
import { dropColumn } from './planners/drop.column';

export class Planner {
  constructor(readonly ctx: IMigrationContext) {}

  async alterTable(target: ITable) {
    const current = this.ctx.reflection.getTableState(target.name);
    const difference = diff(stripMeta(current), stripMeta(target));
    // Track the primary keys change, since it may has to be altered after the columns
    let isPrimaryChanged = false;
    let isPrimaryCreated = false;
    let isPrimaryDropped = false;

    // Create context for the changes
    const changeCtx: ChangeContext = {
      ctx: this.ctx,
      target,
      current,
    };

    for (const change of difference) {
      const { op, path } = change;

      // Changed to logged / unlogged
      if (path[0] === 'isLogged') {
        if (op === 'replace') {
          alterIsLogged(changeCtx);
        }
      } else if (path[0] === 'columns') {
        const columnName = path[1] as string;
        const columnDefinition = target.columns[columnName];

        switch (op) {
          // New column added
          case 'add':
            await addColumn(changeCtx, columnName, columnDefinition);

            // Primary columns altered
            isPrimaryCreated =
              isPrimaryCreated || target.columns[columnName].isPrimary;
            break;

          // Column removed
          case 'remove':
            dropColumn(changeCtx, columnName);

            // Primary columns altered
            isPrimaryDropped =
              isPrimaryDropped || current.columns[columnName].isPrimary;
            break;

          // Column altered
          case 'replace':
            if (path[1] === columnName) {
              // Route the alteration based on the change
              switch (path[2]) {
                case 'isNullable':
                  alterNullable(changeCtx, columnName, columnDefinition);
                  break;
                case 'isUnique':
                  alterUnique(changeCtx, columnName, columnDefinition);
                  break;
                case 'isPrimary':
                  isPrimaryChanged = true;
                  break;
                // case 'isIndexed':
                //   Index changed
                //   break;
                case 'defaultValue':
                  alterDefaultValue(changeCtx, columnName, columnDefinition);
                  break;
                // case 'type':
                //   if (columnDefinition.type.name === ColumnType.ENUM) {
                //     // Changing enum values
                //     if (path[3] === 'values') {
                //       // Check if the native type already exists
                //       if (
                //         this.ctx.reflection.isTypeExists(
                //           columnDefinition.type.nativeName,
                //         )
                //       ) {
                //         // Need to check if the values are the same
                //         // Rename the type if not connected to other tables
                //         // Fail if so
                //         // Then create the new type and use the old name
                //         // And after it's created we can drop the old one
                //       }
                //     }
                //   }
                //   break;
                default:
                  throw new NotImplemented(
                    `Column alteration for [${path[2]}] is not implemented`,
                  );
              }
            } else {
              throw new NotImplemented(
                `Column alteration for [${path[2]}] is not implemented`,
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
              this.ctx.plan.steps.push({
                query: this.ctx.knex.schema.alterTable(target.name, builder =>
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

            this.ctx.plan.steps.push({
              query: this.ctx.knex.schema.alterTable(target.name, builder =>
                builder.unique(target.uniques[uniqueName].columns, {
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
            this.ctx.plan.steps.push({
              query: this.ctx.knex.schema.alterTable(target.name, builder =>
                builder.dropUnique(
                  current.uniques[uniqueName].columns,
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
    if (isPrimaryChanged || isPrimaryCreated || isPrimaryDropped) {
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
          this.ctx.plan.steps.push({
            query: this.ctx.knex.schema.alterTable(target.name, builder =>
              builder.dropPrimary(),
            ),
            risk: MigrationRisk.LOW,
            description: `Dropping primary for ${target.name}`,
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
          this.ctx.plan.steps.push({
            query: this.ctx.knex.schema.alterTable(target.name, builder =>
              builder.primary(expectedPrimaries),
            ),
            risk: MigrationRisk.LOW,
            description: `Creating primary for ${target.name}`,
            phase: 3,
          });
        }
      }
    }
  }

  async _createTable(table: ITable): Promise<void> {
    this.ctx.plan.steps.push({
      query: this.ctx.knex.schema.createTable(table.name, () => {}),
      risk: MigrationRisk.NONE,
      description: `Create table [${table.name}]`,
      phase: 0,
    });

    // Register the fact that the table exits
    this.ctx.reflection.addTable(table.name);

    // By default each table is created as logged
    // But we can alter the table to be unlogged
    if (!table.isLogged) {
      this.ctx.plan.steps.push({
        query: this.ctx.knex.schema.raw(
          `ALTER TABLE ${this.ctx.knex.client.wrapIdentifier(
            table.name,
          )} SET UNLOGGED`,
        ),
        risk: MigrationRisk.NONE,
        description: `Set table [${table.name}] as unlogged`,
        phase: 0,
      });
    }
  }

  async createTable(table: ITable) {
    this._createTable(table);

    await Promise.all([
      this.createColumn(table),
      this.createIndex(table),
      this.createUnique(table),
      this.createForeignKeys(table),
    ]);
  }

  async createColumn(table: ITable) {
    if (Object.keys(table.columns).length) {
      const createColumnsQuery = this.ctx.knex.schema.alterTable(
        table.name,
        builder => {
          for (const name in table.columns) {
            if (Object.prototype.hasOwnProperty.call(table.columns, name)) {
              createColumn(
                builder,
                name,
                table.columns[name],
                table,
                this.ctx.reflection,
              );
            }
          }

          const primaries = ColumnTools.filterPrimary(table);

          if (primaries.length > 1) {
            builder.primary(primaries);
          }
        },
      );

      this.ctx.plan.steps.push({
        query: createColumnsQuery,
        risk: MigrationRisk.NONE,
        description: `Create columns for table [${table.name}]`,
        phase: 1,
      });
    }
  }

  async createIndex(table: ITable) {
    // Apply the composite indexes
    for (const indexName in table.indexes) {
      if (Object.prototype.hasOwnProperty.call(table.indexes, indexName)) {
        const createIndexQuery = this.ctx.knex.schema.alterTable(
          table.name,
          builder =>
            builder.index(
              table.indexes[indexName].columns,
              indexName,
              table.indexes[indexName].type,
            ),
        );

        this.ctx.plan.steps.push({
          query: createIndexQuery,
          risk: MigrationRisk.LOW,
          description: `Create composite index [${indexName}] for table [${table.name}]`,
          phase: 2,
        });
      }
    }
  }

  async createUnique(table: ITable) {
    // Apply the composite unique constraints
    for (const uniqueName in table.uniques) {
      if (Object.prototype.hasOwnProperty.call(table.uniques, uniqueName)) {
        if (this.ctx.reflection.isUniqueConstraintExists(uniqueName)) {
          throw new Error(
            `Unique constraint [${uniqueName}] for [${table.name}] already exists`,
          );
        }

        const createUniqueQuery = this.ctx.knex.schema.alterTable(
          table.name,
          builder =>
            builder.unique(table.uniques[uniqueName].columns, {
              indexName: uniqueName,
            }),
        );

        this.ctx.plan.steps.push({
          query: createUniqueQuery,
          risk: MigrationRisk.NONE,
          description: `Create composite unique [${uniqueName}] for table [${table.name}]`,
          phase: 2,
        });

        // Track to avoid duplicates in the same migration context.
        this.ctx.reflection.addUnique(uniqueName);
      }
    }
  }

  async createForeignKeys(_table: ITable) {
    // Add foreign keys
    for (const foreignKeyName in _table.relations) {
      if (
        Object.prototype.hasOwnProperty.call(_table.relations, foreignKeyName)
      ) {
        const relation = _table.relations[foreignKeyName];
        const { table, columns } = relation.references;
        const { onDelete, onUpdate } = relation;

        const createForeignKeyQuery = this.ctx.knex.schema.alterTable(
          _table.name,
          builder =>
            builder
              .foreign(relation.columns, foreignKeyName)
              .references(columns)
              .inTable(table)
              .onDelete(onDelete)
              .onUpdate(onUpdate),
        );

        this.ctx.reflection.addTableForeignKey(
          _table.name,
          foreignKeyName,
          relation,
        );

        this.ctx.plan.steps.push({
          query: createForeignKeyQuery,
          risk: this.ctx.reflection.isTableExists(table)
            ? MigrationRisk.LOW
            : MigrationRisk.HIGH, // Foreign table may not exists yet!
          description: `Create foreign key [${foreignKeyName}] for table [${_table.name}]`,
          phase: 8,
        });
      }
    }
  }
}

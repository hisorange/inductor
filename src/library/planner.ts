import { diff } from 'just-diff';
import { NotImplemented } from '../exception/not-implemented.exception';
import { ChangeContext } from '../types/change-context.interface';
import { IColumn } from '../types/column.interface';
import { IMigrationContext } from '../types/migration-context.interface';
import { ITable } from '../types/table.interface';
import { stripMeta } from '../utils/strip-meta';
import { addColumn } from './planners/add.column';
import { addCompositeUnique } from './planners/add.composite-unique';
import { alterDefaultValue } from './planners/alter.default-value';
import { alterIndex } from './planners/alter.index';
import { alterIsLogged } from './planners/alter.is-logged';
import { alterNullable } from './planners/alter.nullable';
import { alterPrimaryKeys } from './planners/alter.primary-keys';
import { alterType } from './planners/alter.type';
import { alterUnique } from './planners/alter.unique';
import { createColumns } from './planners/create.columns';
import { createForeignKeys } from './planners/create.foreign-keys';
import { createIndexes } from './planners/create.indexes';
import { createTable } from './planners/create.table';
import { createUniques } from './planners/create.uniques';
import { dropColumn } from './planners/drop.column';
import { dropCompositeUnique } from './planners/drop.composite-unique';

export class Planner {
  constructor(readonly ctx: IMigrationContext) {}

  /**
   * Almost no risk, since the table is created. Only the risk of the columns creation where impossible types or default values are used.
   *
   * @param {ITable} table
   */
  async createTable(table: ITable) {
    createTable(table, this.ctx);
    createColumns(table, this.ctx);
    createIndexes(table, this.ctx);
    createUniques(table, this.ctx);
    createForeignKeys(table, this.ctx);
  }

  /**
   * Calculate the changes to apply to the table, can be high or impossible risk, as some definition may not be applicable, for example removing enum values if they are used in the table.
   *
   * @param {ITable} target
   */
  async alterTable(target: ITable) {
    const current = this.ctx.reflection.getTableState(target.name);
    const differences = diff(stripMeta(current), stripMeta(target));
    // Track the primary keys change, since it may has to be altered after the columns
    let isPrimaryChanged = false;
    let isPrimaryCreated = false;
    let isPrimaryDropped = false;

    // Create context for the changes
    const change: ChangeContext = {
      ctx: this.ctx,
      target,
      current,
    };

    for (const entry of differences) {
      const { op: operation, path } = entry;
      const tableProperty = path[0] as keyof ITable;

      // Changes the isLogged state
      if (tableProperty === 'isLogged') {
        if (operation === 'replace') {
          alterIsLogged(change);
        }
      }

      // Changes a column
      if (tableProperty === 'columns') {
        const columnName = path[1] as string;
        const columnDefinition = target.columns[columnName];

        switch (operation) {
          // Adds a new column
          case 'add':
            await addColumn(change, columnName, columnDefinition);

            // Primary columns altered
            isPrimaryCreated =
              isPrimaryCreated || target.columns[columnName].isPrimary;
            break;

          // Drops a column
          case 'remove':
            dropColumn(change, columnName);

            // Primary columns altered
            isPrimaryDropped =
              isPrimaryDropped || current.columns[columnName].isPrimary;
            break;

          // Column definition changed
          case 'replace':
            const columnProperty = path[2] as keyof IColumn;

            switch (columnProperty) {
              case 'isPrimary':
                isPrimaryChanged = true;
                break;
              case 'isNullable':
                alterNullable(change, columnName, columnDefinition);
                break;
              case 'isUnique':
                alterUnique(change, columnName, columnDefinition);
                break;
              case 'isIndexed':
                alterIndex();
                break;
              case 'defaultValue':
                alterDefaultValue(change, columnName, columnDefinition);
                break;
              case 'type':
                alterType();
                break;
              default:
                throw new NotImplemented(
                  `Column alteration for [${path[2]}] is not implemented`,
                );
            }
        }
      }
      // Change is affecting the unique set
      else if (tableProperty === 'uniques') {
        const uniqueName = path[1] as string;

        switch (operation) {
          // New unique added
          case 'add':
            addCompositeUnique(change, uniqueName);
            break;

          // Unique removed
          case 'remove':
            dropCompositeUnique(change, uniqueName);
            break;
        }
      }
    }

    // Primary key changed
    if (isPrimaryChanged || isPrimaryCreated || isPrimaryDropped) {
      alterPrimaryKeys(change, {
        isPrimaryCreated,
        isPrimaryDropped,
      });
    }
  }
}

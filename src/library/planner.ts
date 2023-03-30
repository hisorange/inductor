import { diff } from 'just-diff';
import { IChange } from '../types/change.interface';
import { IColumn } from '../types/column.interface';
import { IMigrationContext } from '../types/migration-context.interface';
import { ITable } from '../types/table.interface';
import { addColumn } from './planners/add.column';
import { alterColumn } from './planners/alter.column';
import { alterCompositeUnique } from './planners/alter.composite-unique';
import { alterIsLogged } from './planners/alter.is-logged';
import { alterPrimaryKeys } from './planners/alter.primary-keys';
import { createColumns } from './planners/create.columns';
import { createForeignKeys } from './planners/create.foreign-keys';
import { createIndexes } from './planners/create.indexes';
import { createTable } from './planners/create.table';
import { createUniques } from './planners/create.uniques';
import { dropColumn } from './planners/drop.column';

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
    const differences = diff(current, target);
    // Track the primary keys change, since it may has to be altered after the columns
    let isPrimaryCreated = false;
    let isPrimaryDropped = false;

    // Create context for the changes
    const change: IChange = {
      context: this.ctx,
      target,
      current,
      isPrimaryChanged: false,
    };

    // console.log('Differences: ', differences);

    for (const entry of differences) {
      const { op, path } = entry;
      const tableKey = path[0] as keyof ITable;

      // Changes the isLogged state
      if (tableKey === 'isLogged') {
        alterIsLogged(change);
      }
      // Changes a column
      else if (tableKey === 'columns') {
        const columnName = path[1] as string;
        const columnDefinition = target.columns[columnName];

        if (path.length === 2) {
          switch (op) {
            // Adds a new column
            case 'add':
              await addColumn(change, columnName, columnDefinition);

              // Primary columns altered
              isPrimaryCreated =
                isPrimaryCreated || !!target.columns[columnName]?.isPrimary;
              break;

            // Drops a column
            case 'remove':
              dropColumn(change, columnName);

              // Primary columns altered
              isPrimaryDropped =
                isPrimaryDropped || !!current.columns[columnName]?.isPrimary;
              break;

            // Column definition changed
            case 'replace':
              await alterColumn(
                change,
                path[2] as keyof IColumn,
                columnName,
                columnDefinition,
              );
              break;
          }
        } else {
          await alterColumn(
            change,
            path[2] as keyof IColumn,
            columnName,
            columnDefinition,
          );
        }
      }
      // Change is affecting the unique set
      else if (tableKey === 'uniques') {
        await alterCompositeUnique(change, op, path[1] as string);
      }
      // Change is affecting the indexes
      else if (tableKey === 'indexes') {
      }
      // Change is affecting the foreign keys
      else if (tableKey === 'relations') {
      }
    }

    // Primary key changed
    if (change.isPrimaryChanged || isPrimaryCreated || isPrimaryDropped) {
      alterPrimaryKeys(change, {
        isPrimaryCreated,
        isPrimaryDropped,
      });
    }
  }
}

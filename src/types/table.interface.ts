import { IColumn } from './column.interface';
import { ICompositeIndex } from './index.interface';
import { IRelation } from './relation.interface';
import { IUnique } from './unique.interface';

export interface ITable {
  /**
   * Programatical identified of the table.
   */
  name: string;

  /**
   * Columns of the table.
   */
  columns: {
    [columnRef: string]: IColumn;
  };

  /**
   * Unique constraints of the table.
   */
  uniques: {
    [uniqueName: string]: IUnique;
  };

  /**
   * Indices of the table.
   */
  indexes: {
    [indexName: string]: ICompositeIndex;
  };

  /**
   * Foreign keys of the table.
   */
  relations: {
    [foreignKeyName: string]: IRelation;
  };

  /**
   * Unlogged tables are not replicated to standby servers.
   * This is useful for tables that are used for logging or temporary storage.
   */
  isUnlogged?: boolean;

  /**
   * Comment based meta information.
   */
  meta: {
    alias?: string;
    description?: string;
    [key: string]: any;
  };
}

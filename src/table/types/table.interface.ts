import { IColumn } from './column.interface';
import { ICompositeIndex } from './index.interface';
import { IRelation } from './relation.interface';
import { IUnique } from './unique.interface';

export interface ITable<
  TableMeta = unknown,
  ColumnMeta = unknown,
  UniqueMeta = unknown,
  IndexMeta = unknown,
  RelationMeta = unknown,
> {
  /**
   * Programatical identified of the table.
   */
  name: string;

  /**
   * Columns of the table.
   */
  columns: {
    [columnRef: string]: IColumn<ColumnMeta>;
  };

  /**
   * Unique constraints of the table.
   */
  uniques: {
    [uniqueName: string]: IUnique<UniqueMeta>;
  };

  /**
   * Indices of the table.
   */
  indexes: {
    [indexName: string]: ICompositeIndex<IndexMeta>;
  };

  /**
   * Foreign keys of the table.
   */
  relations: {
    [foreignKeyName: string]: IRelation<RelationMeta>;
  };

  /**
   * Unlogged tables are not replicated to standby servers.
   * This is useful for tables that are used for logging or temporary storage.
   */
  isLogged: boolean;

  /**
   * Associated metadata with the table
   */
  meta?: TableMeta;
}

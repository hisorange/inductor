import { IColumn } from './column.interface';

export interface ISchema {
  /**
   * Can define view or table.
   */
  kind: 'table';

  /**
   * Programatical identified. (applied as the table's name)
   */
  tableName: string;

  /**
   * Columns of the table.
   */
  columns: {
    [columnName: string]: IColumn;
  };

  /**
   * Unique constraints of the table.
   */
  uniques: {
    [constraintName: string]: string[];
  };

  /**
   * Indices of the table.
   */
  indexes: {
    [indexName: string]: string[];
  };
}

import { IColumn } from './column.interface';

export interface ISchema {
  /**
   * Can define view or table.
   */
  kind: 'table' | 'view';

  /**
   * Programatical identified. (applied as the table's name)
   */
  name: string;

  /**
   * Columns of the table.
   */
  columns: {
    [name: string]: IColumn;
  };

  /**
   * Unique constraints of the table.
   */
  uniques: {
    [name: string]: string[];
  };
}

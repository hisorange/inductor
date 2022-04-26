import { ColumnType } from '../enum/column-type.enum';

export interface ISchema {
  /**
   * Can define view or table.
   */
  kind: 'table' | 'view';

  /**
   * Programatical identified. (applied as the table's name)
   */
  name: string;

  columns: {
    [name: string]: {
      kind: 'column';
      type: ColumnType;
      name: string;
    };
  };
}

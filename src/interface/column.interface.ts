import { ColumnType } from '../enum/column-type.enum';

export interface IColumn {
  /**
   * Columns can be defined as a traditional column,
   * but also as virtual / stored / computed columns.
   */
  kind: 'column';

  /**
   * Mapping to the PostgreSQL 14's data type
   */
  type: ColumnType;

  /**
   * Nullable rule.
   */
  isNullable: boolean;

  /**
   * Unique contraint.
   */
  isUnique: boolean;
}

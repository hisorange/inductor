import { ColumnType } from '../enum/column-type.enum';

export interface IColumn {
  /**
   * Columns can be defined as a traditional column,
   * but also as virtual / stored / computed columns.
   */
  kind: 'column';

  /**
   * Property alias on the model.
   */
  propertyName?: string;

  /**
   * Mapping to the PostgreSQL 14's data type
   */
  type: ColumnType;

  /**
   * Nullable constraint.
   */
  isNullable: boolean;

  /**
   * Unique contraint.
   */
  isUnique: boolean;

  /**
   * Primary key constraint.
   */
  isPrimary: boolean;
}

import { Pojo } from 'objection';
import { PostgresColumnType } from '../../driver/postgres/postgres.column-type';
import { PostgresIndexType } from '../../driver/postgres/postgres.index-type';

export interface IColumn<ColumnMeta = unknown> {
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
  type: PostgresColumnType;

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

  /**
   * Index
   */
  isIndexed: false | PostgresIndexType;

  /**
   * Default value
   */
  defaultValue:
    | string
    | number
    | boolean
    | null
    | undefined
    | Array<unknown>
    | Pojo;

  /**
   * Associated metadata with the database
   */
  meta?: ColumnMeta;
}

import { Pojo } from 'objection';
import { PostgresColumnType } from '../../driver/postgres/postgres.column-type';
import { PostgresIndexType } from '../../driver/postgres/postgres.index-type';

interface IBaseColumn<ColumnMeta> {
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

interface ICommonColumn<ColumnMeta = unknown> extends IBaseColumn<ColumnMeta> {
  type: PostgresColumnType;
}

export interface IEnumeratedColumn<ColumnMeta = unknown>
  extends IBaseColumn<ColumnMeta> {
  type: PostgresColumnType.ENUM; // TODO refactor into type object with values and native type name
  values: string[];
}

export type IColumn<ColumnMeta = unknown> =
  | ICommonColumn<ColumnMeta>
  | IEnumeratedColumn<ColumnMeta>;

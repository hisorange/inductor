import { IColumn } from './column.interface';

export interface ISchema<SchemaMeta = unknown, ColumnMeta = unknown> {
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
    [columnRef: string]: IColumn<ColumnMeta>;
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

  /**
   * Associated metadata with the schema
   */
  meta?: SchemaMeta;
}

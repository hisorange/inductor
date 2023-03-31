import { IColumn } from './column.interface';
import { IRelation } from './relation.interface';
import { ITable } from './table.interface';

export type ColumnInfo = {
  defaultValue: IColumn['defaultValue'];
  isNullable: boolean;
  typeName: string;
  maxLength: number | null;
  precision: number | null;
  scale: number | null;
  comment: string | null;
};

export interface IDatabaseState {
  tables: string[];
  unloggedTables: string[];
  types: string[];
  uniqueConstraints: string[];
  tablesMeta: {
    [tableName: string]: {
      isLogged: boolean;
      comment: string;
    };
  };
  uniques: {
    [tableName: string]: ITable['uniques'];
  };
  relations: {
    [tableName: string]: {
      [foreignKeyName: string]: IRelation;
    };
  };
  tableRowChecks: Map<string, boolean>;
  compositePrimaryKeys: {
    [tableName: string]: string[];
  };
  indexes: {
    [tableName: string]: ITable['indexes'];
  };
  columnValues: {
    [tableName: string]: {
      [columnName: string]: ColumnInfo;
    };
  };
  enumerators: {
    [tableName: string]: {
      [columnName: string]: {
        nativeType: string;
        values: string[];
      };
    };
  };
}

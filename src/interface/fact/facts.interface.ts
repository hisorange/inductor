import { IBlueprint, IColumn, IRelation } from '../blueprint';

export interface IFacts {
  tables: string[];
  types: string[];
  uniqueConstraints: string[];
  uniques: {
    [tableName: string]: IBlueprint['uniques'];
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
    [tableName: string]: IBlueprint['indexes'];
  };
  columnValues: {
    [tableName: string]: {
      [columnName: string]: {
        defaultValue: IColumn['defaultValue'];
        isNullable: boolean;
        typeName: string;
      };
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

import { IBlueprint, IRelation } from '../blueprint';

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
}

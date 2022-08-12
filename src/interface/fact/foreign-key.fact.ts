import { IRelation } from '../blueprint';

export interface IForeginKeyFact {
  [tableName: string]: {
    [constraintName: string]: IRelation;
  };
}

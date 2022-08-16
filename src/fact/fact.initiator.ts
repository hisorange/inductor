import { IFacts } from './types/facts.interface';

export const initFacts = (): IFacts => ({
  tables: [],
  types: [],
  uniqueConstraints: [],
  uniques: {},
  relations: {},
  tableRowChecks: new Map<string, boolean>(),
  compositePrimaryKeys: {},
  indexes: {},
  columnValues: {},
  enumerators: {},
});

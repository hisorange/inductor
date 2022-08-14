import { IFacts } from '../interface/fact/facts.interface';

export const createFacts = (): IFacts => ({
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

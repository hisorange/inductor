import { ITable } from '../types/table.interface';

export const InitiateTable = (name: string): ITable => ({
  name,
  isUnlogged: false,
  columns: {},
  uniques: {},
  indexes: {},
  relations: {},
  meta: {},
});

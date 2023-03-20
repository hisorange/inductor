import { ITable } from './types';

export const InitiateTable = (name: string): ITable => ({
  name,
  columns: {},
  uniques: {},
  indexes: {},
  relations: {},
  isLogged: true,
});

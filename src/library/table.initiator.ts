import { ITable } from '../types/table.interface';

export const InitiateTable = (name: string): ITable => ({
  name,
  columns: {},
  uniques: {},
  indexes: {},
  relations: {},
  isLogged: true,
});

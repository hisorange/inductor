import { ITable } from '../types/table.interface';
import { toUUID } from '../utils/str-to-uuid';

export const InitiateTable = (name: string): ITable => ({
  name,
  isUnlogged: false,
  columns: {},
  uniques: {},
  indexes: {},
  relations: {},
  meta: {
    id: toUUID(name),
  },
});

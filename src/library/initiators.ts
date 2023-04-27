import { randomUUID } from 'crypto';
import { IDatabase } from '../types/database.interface';
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

export const InitiateDatabase = (name?: string): IDatabase => ({
  meta: {
    id: name ? toUUID(name) : randomUUID(),
  },
  tables: [],
});

import { Inductor } from '../../src/inductor';
import { IDatabase } from '../../src/interface/database.interface';

export const createTestInstance = (filters: string[] = []) => {
  const database: IDatabase = {
    id: 'test_database',
    connection: {
      host: 'localhost',
      port: 9999,
      database: 'inductor',
      user: 'inductor',
      password: 'inductor',
    },
    provider: 'postgres',
    isReadOnly: false,
    schemas: {},
    schemaFilters: filters,
  };

  return new Inductor(database);
};
